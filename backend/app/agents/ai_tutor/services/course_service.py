"""Course service — pipeline execution and on-demand lesson/quiz generation.

Curriculum validation runs during course creation; on-demand lessons generate directly.
"""

import json
from dataclasses import dataclass
from typing import AsyncIterator

from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.ai_tutor.agents.course_creation import run_course_creation_stream
from app.agents.ai_tutor.client_factory import ai_client_factory
from app.agents.ai_tutor.language import language_instruction
from app.agents.ai_tutor.schemas.lesson import LessonContent
from app.agents.ai_tutor.schemas.quiz import FinalTestOutput, QuizOutput
from app.agents.ai_tutor.streaming import format_sse, stream_agent
from app.constants import QuizType
from app.db import repository as repo
from app.db.models import Subtopic
from app.serializers.course import serialize_course_created


@dataclass(frozen=True)
class CachedContent:
    data: dict


@dataclass(frozen=True)
class GeneratedStream:
    iterator: AsyncIterator[str]


ContentResult = CachedContent | GeneratedStream


def _build_lesson_prompt(subtopic: Subtopic, course_level: str, lang: str) -> str:
    if subtopic.lesson_prompt:
        return (
            f"Subtopic: '{subtopic.name}'\n"
            f"Level: {course_level}\n\n"
            f"Generation instructions:\n{subtopic.lesson_prompt}\n"
            f"{language_instruction(lang)}"
        )
    return (
        f"Generate a complete lesson for subtopic '{subtopic.name}' "
        f"at {course_level} level."
        f"{language_instruction(lang)}"
    )


async def create_course_stream(
    db: AsyncSession,
    user_id: int,
    user_goal: str,
    lang: str = "en",
) -> AsyncIterator[str]:
    """Run the course-creation pipeline and yield SSE lines."""
    api_key = await ai_client_factory.require_openai_key(db, user_id)
    output = None
    async for sse_line, result in run_course_creation_stream(
        user_goal, api_key=api_key, lang=lang
    ):
        if result is not None:
            output = result
        else:
            yield sse_line

    if output is None:
        yield format_sse({"type": "error", "message": "Agent produced no output"})
        return

    course = await repo.create_course(
        db,
        topic=output.plan.topic,
        level=output.plan.level,
        goal=output.plan.goal,
        estimated_hours=output.plan.estimated_hours,
        language=lang,
        user_id=user_id,
    )
    await repo.persist_blueprint(db, course.id, output.blueprint.model_dump_json())
    await repo.set_course_ready(db, course.id)
    await db.commit()

    full_course = await repo.get_course(db, course.id)
    yield format_sse(
        {"type": "complete", "data": serialize_course_created(full_course)}
    )


async def _generate_lesson_stream(
    db: AsyncSession,
    user_id: int,
    subtopic: Subtopic,
    course_level: str,
    lang: str = "en",
) -> AsyncIterator[str]:
    api_key = await ai_client_factory.require_openai_key(db, user_id)
    agent = ai_client_factory.make_lesson_agent(api_key)
    prompt = _build_lesson_prompt(subtopic, course_level, lang)
    agent_input = {"messages": [HumanMessage(content=prompt)]}
    lesson_content: LessonContent | None = None

    async for sse_line, result in stream_agent(
        agent, agent_input, partial_tool_name="LessonContent"
    ):
        if result is not None:
            lesson_content = result
        else:
            yield sse_line

    if lesson_content is None:
        yield format_sse({"type": "error", "message": "Lesson agent produced no output"})
        return

    db_lesson = await repo.save_lesson(
        db, subtopic.id, lesson_content.model_dump_json(), validated=True
    )
    await db.commit()
    yield format_sse({"type": "complete", "data": json.loads(db_lesson.content_json)})


async def _generate_quiz_stream(
    db: AsyncSession,
    user_id: int,
    subtopic: Subtopic,
    course_level: str,
    lesson_json: str | None = None,
    lang: str = "en",
) -> AsyncIterator[str]:
    api_key = await ai_client_factory.require_openai_key(db, user_id)
    agent = ai_client_factory.make_quiz_agent(api_key)
    lesson_context = f"\n\nLesson content:\n{lesson_json}" if lesson_json else ""
    prompt = (
        f"Generate exactly 3 multiple-choice quiz questions for the subtopic "
        f"'{subtopic.name}' at {course_level} level.{lesson_context}"
        f"{language_instruction(lang)}"
    )
    agent_input = {"messages": [HumanMessage(content=prompt)]}
    quiz_content: QuizOutput | None = None

    async for sse_line, result in stream_agent(agent, agent_input):
        if result is not None:
            quiz_content = result
        else:
            yield sse_line

    if quiz_content is None:
        yield format_sse({"type": "error", "message": "Quiz agent produced no output"})
        return

    db_quiz = await repo.save_quiz(
        db, subtopic.id, quiz_content.model_dump_json(), validated=True
    )
    await db.commit()
    yield format_sse({"type": "complete", "data": json.loads(db_quiz.questions_json)})


async def _generate_final_test_stream(
    db: AsyncSession,
    user_id: int,
    course_level: str,
    module_name: str,
    subtopics: list[Subtopic],
    weak_topic_names: list[str],
    lang: str = "en",
) -> AsyncIterator[str]:
    if not subtopics:
        yield format_sse({"type": "error", "message": "No subtopics to generate final test for."})
        return

    api_key = await ai_client_factory.require_openai_key(db, user_id)
    agent = ai_client_factory.make_final_test_agent(api_key)
    subtopic_names = [s.name for s in subtopics]
    weak_note = (
        f"Weak topics (score extra weight): {weak_topic_names}" if weak_topic_names else ""
    )
    prompt = (
        f"Generate a final test for the '{module_name}' module at {course_level} level.\n"
        f"Subtopics covered: {subtopic_names}.\n"
        f"{weak_note}"
        f"{language_instruction(lang)}"
    )
    agent_input = {"messages": [HumanMessage(content=prompt)]}
    final_test_content: FinalTestOutput | None = None

    async for sse_line, result in stream_agent(agent, agent_input):
        if result is not None:
            final_test_content = result
        else:
            yield sse_line

    if final_test_content is None:
        yield format_sse({"type": "error", "message": "Final test agent produced no output"})
        return

    anchor_subtopic = subtopics[0]
    db_quiz = await repo.save_final_quiz(
        db, anchor_subtopic.id, final_test_content.model_dump_json()
    )
    await db.commit()
    yield format_sse({"type": "complete", "data": json.loads(db_quiz.questions_json)})


async def resolve_lesson(
    db: AsyncSession,
    user_id: int,
    subtopic: Subtopic,
    course_level: str,
    lang: str = "en",
) -> ContentResult:
    existing = await repo.get_lesson(db, subtopic.id)
    if existing:
        return CachedContent(data=json.loads(existing.content_json))
    return GeneratedStream(
        iterator=_generate_lesson_stream(db, user_id, subtopic, course_level, lang)
    )


async def resolve_quiz(
    db: AsyncSession,
    user_id: int,
    subtopic: Subtopic,
    course_level: str,
    lang: str = "en",
) -> ContentResult:
    existing = await repo.get_quiz(db, subtopic.id, QuizType.SUBTOPIC)
    if existing:
        return CachedContent(data=json.loads(existing.questions_json))

    lesson = await repo.get_lesson(db, subtopic.id)
    lesson_json = lesson.content_json if lesson else None
    return GeneratedStream(
        iterator=_generate_quiz_stream(
            db, user_id, subtopic, course_level, lesson_json, lang
        )
    )


async def resolve_final_test(
    db: AsyncSession,
    user_id: int,
    course_id: int,
    course_level: str,
    module_name: str,
    subtopics: list[Subtopic],
    lang: str = "en",
) -> ContentResult:
    if subtopics:
        existing = await repo.get_quiz(db, subtopics[0].id, QuizType.FINAL)
        if existing:
            return CachedContent(data=json.loads(existing.questions_json))

    progress_records = await repo.get_course_progress(db, course_id)
    weak_names = [
        record.subtopic.name
        for record in progress_records
        if record.subtopic and record.quiz_score is not None and record.quiz_score < 0.70
    ]
    return GeneratedStream(
        iterator=_generate_final_test_stream(
            db,
            user_id,
            course_level,
            module_name,
            subtopics,
            weak_names,
            lang,
        )
    )

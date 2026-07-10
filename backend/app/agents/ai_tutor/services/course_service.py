"""Course service — pipeline execution and on-demand lesson/quiz generation.

Validation and retry logic is now handled internally by the DeepAgents supervisors.
"""

import json
from typing import AsyncIterator

from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.ai_tutor.agents.on_demand_agent import (
    make_final_test_agent,
    make_lesson_agent,
    make_quiz_agent,
)
from app.agents.ai_tutor.orchestrator import run_course_creation, run_course_creation_stream
from app.agents.ai_tutor.schemas.lesson import LessonContent
from app.agents.ai_tutor.schemas.quiz import FinalTestOutput, QuizOutput
from app.agents.ai_tutor.streaming import format_sse, stream_agent
from app.db import repository as repo
from app.db.models import Course, Lesson, Quiz, Subtopic

LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "pt-BR": "Portuguese (Brazil)",
}


def _language_instruction(lang: str) -> str:
    name = LANGUAGE_NAMES.get(lang, "English")
    return f"\n\nIMPORTANT: Write ALL output in {name}. Every sentence, explanation, and example must be in {name}."


def _extract_structured(result: dict):
    return result.get("structured_response")


# ---------------------------------------------------------------------------
# Course creation
# ---------------------------------------------------------------------------


async def create_course(db: AsyncSession, user_goal: str, lang: str = "en") -> Course:
    """Run the full pipeline (plan → research → build) and persist the result."""
    output = await run_course_creation(user_goal, lang=lang)

    course = await repo.create_course(db, output.plan, language=lang)
    await repo.persist_blueprint(db, course.id, output.blueprint)
    await repo.set_course_ready(db, course.id)
    await db.commit()

    return await repo.get_course(db, course.id)


# ---------------------------------------------------------------------------
# On-demand lesson generation
# ---------------------------------------------------------------------------


async def get_or_generate_lesson(
    db: AsyncSession,
    subtopic: Subtopic,
    course_level: str,
    lang: str = "en",
) -> Lesson:
    """Return cached lesson or generate via the lesson supervisor, then cache it."""
    existing = await repo.get_lesson(db, subtopic.id)
    if existing:
        return existing

    agent = make_lesson_agent()
    prompt = (
        f"Generate a complete lesson for subtopic '{subtopic.name}' "
        f"at {course_level} level."
        f"{_language_instruction(lang)}"
    )
    result = await agent.ainvoke({"messages": [HumanMessage(content=prompt)]})
    lesson: LessonContent = _extract_structured(result)

    db_lesson = await repo.save_lesson(db, subtopic.id, lesson, validated=True)
    await db.commit()
    return db_lesson


# ---------------------------------------------------------------------------
# On-demand quiz generation
# ---------------------------------------------------------------------------


async def get_or_generate_quiz(
    db: AsyncSession,
    subtopic: Subtopic,
    course_level: str,
    lesson_json: str | None = None,
    lang: str = "en",
) -> Quiz:
    """Return cached subtopic quiz or generate via the quiz supervisor, then cache it."""
    existing = await repo.get_quiz(db, subtopic.id, "subtopic")
    if existing:
        return existing

    agent = make_quiz_agent()
    lesson_context = f"\n\nLesson content:\n{lesson_json}" if lesson_json else ""
    prompt = (
        f"Generate exactly 3 multiple-choice quiz questions for the subtopic "
        f"'{subtopic.name}' at {course_level} level.{lesson_context}"
        f"{_language_instruction(lang)}"
    )
    result = await agent.ainvoke({"messages": [HumanMessage(content=prompt)]})
    quiz: QuizOutput = _extract_structured(result)

    db_quiz = await repo.save_quiz(db, subtopic.id, quiz, validated=True)
    await db.commit()
    return db_quiz


# ---------------------------------------------------------------------------
# Final test generation
# ---------------------------------------------------------------------------


async def generate_final_test(
    db: AsyncSession,
    module_id: int,
    course_level: str,
    module_name: str,
    subtopics: list[Subtopic],
    weak_topic_names: list[str],
    lang: str = "en",
) -> Quiz:
    """Generate a final test for a module (20-40 questions, first subtopic as anchor row)."""
    if not subtopics:
        raise ValueError("No subtopics to generate final test for.")

    agent = make_final_test_agent()

    subtopic_names = [s.name for s in subtopics]
    weak_note = (
        f"Weak topics (score extra weight): {weak_topic_names}" if weak_topic_names else ""
    )
    prompt = (
        f"Generate a final test for the '{module_name}' module at {course_level} level.\n"
        f"Subtopics covered: {subtopic_names}.\n"
        f"{weak_note}"
        f"{_language_instruction(lang)}"
    )
    result = await agent.ainvoke({"messages": [HumanMessage(content=prompt)]})
    final_test: FinalTestOutput = _extract_structured(result)

    anchor_subtopic = subtopics[0]
    db_quiz = await repo.save_final_quiz(
        db, anchor_subtopic.id, final_test.model_dump_json()
    )
    await db.commit()
    return db_quiz


# ---------------------------------------------------------------------------
# Streaming variants
# ---------------------------------------------------------------------------


async def create_course_stream(
    db: AsyncSession,
    user_goal: str,
    lang: str = "en",
) -> AsyncIterator[str]:
    """Streaming variant of create_course — yields SSE lines.

    Progress events are yielded as they come in; the final event is
    `complete` with the course JSON payload.
    """
    output = None
    async for sse_line, result in run_course_creation_stream(user_goal, lang=lang):
        if result is not None:
            output = result
        else:
            yield sse_line

    if output is None:
        yield format_sse({"type": "error", "message": "Agent produced no output"})
        return

    course = await repo.create_course(db, output.plan, language=lang)
    await repo.persist_blueprint(db, course.id, output.blueprint)
    await repo.set_course_ready(db, course.id)
    await db.commit()

    full_course = await repo.get_course(db, course.id)
    payload = {
        "id": full_course.id,
        "topic": full_course.topic,
        "goal": full_course.goal,
        "level": full_course.level,
        "language": full_course.language,
        "status": full_course.status,
        "modules": [
            {
                "id": m.id,
                "name": m.name,
                "order": m.order,
                "subtopics": [
                    {"id": s.id, "name": s.name, "order": s.order}
                    for s in m.subtopics
                ],
            }
            for m in full_course.modules
        ],
    }
    yield format_sse({"type": "complete", "data": payload})


async def get_or_generate_lesson_stream(
    db: AsyncSession,
    subtopic: Subtopic,
    course_level: str,
    lang: str = "en",
) -> AsyncIterator[str]:
    """Streaming variant — yields SSE progress lines then a complete event.

    If the lesson is cached, yields a single `complete` event immediately.
    """
    existing = await repo.get_lesson(db, subtopic.id)
    if existing:
        yield format_sse({"type": "complete", "data": json.loads(existing.content_json)})
        return

    agent = make_lesson_agent()
    prompt = (
        f"Generate a complete lesson for subtopic '{subtopic.name}' "
        f"at {course_level} level."
        f"{_language_instruction(lang)}"
    )
    agent_input = {"messages": [HumanMessage(content=prompt)]}
    lesson_content: LessonContent | None = None

    async for sse_line, result in stream_agent(agent, agent_input, partial_tool_name="LessonContent"):
        if result is not None:
            lesson_content = result
        else:
            yield sse_line

    if lesson_content is None:
        yield format_sse({"type": "error", "message": "Lesson agent produced no output"})
        return

    db_lesson = await repo.save_lesson(db, subtopic.id, lesson_content, validated=True)
    await db.commit()
    yield format_sse({"type": "complete", "data": json.loads(db_lesson.content_json)})


async def get_or_generate_quiz_stream(
    db: AsyncSession,
    subtopic: Subtopic,
    course_level: str,
    lesson_json: str | None = None,
    lang: str = "en",
) -> AsyncIterator[str]:
    """Streaming variant of get_or_generate_quiz."""
    existing = await repo.get_quiz(db, subtopic.id, "subtopic")
    if existing:
        yield format_sse({"type": "complete", "data": json.loads(existing.questions_json)})
        return

    agent = make_quiz_agent()
    lesson_context = f"\n\nLesson content:\n{lesson_json}" if lesson_json else ""
    prompt = (
        f"Generate exactly 3 multiple-choice quiz questions for the subtopic "
        f"'{subtopic.name}' at {course_level} level.{lesson_context}"
        f"{_language_instruction(lang)}"
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

    db_quiz = await repo.save_quiz(db, subtopic.id, quiz_content, validated=True)
    await db.commit()
    yield format_sse({"type": "complete", "data": json.loads(db_quiz.questions_json)})


async def generate_final_test_stream(
    db: AsyncSession,
    module_id: int,
    course_level: str,
    module_name: str,
    subtopics: list[Subtopic],
    weak_topic_names: list[str],
    lang: str = "en",
) -> AsyncIterator[str]:
    """Streaming variant of generate_final_test."""
    if not subtopics:
        yield format_sse({"type": "error", "message": "No subtopics to generate final test for."})
        return

    agent = make_final_test_agent()
    subtopic_names = [s.name for s in subtopics]
    weak_note = (
        f"Weak topics (score extra weight): {weak_topic_names}" if weak_topic_names else ""
    )
    prompt = (
        f"Generate a final test for the '{module_name}' module at {course_level} level.\n"
        f"Subtopics covered: {subtopic_names}.\n"
        f"{weak_note}"
        f"{_language_instruction(lang)}"
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

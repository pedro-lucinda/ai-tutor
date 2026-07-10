"""Repository layer — all database access goes through here."""

import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.ai_tutor.schemas import (
    CourseBlueprint,
    LearningPlanOutput,
    LessonContent,
    QuizOutput,
    ValidationResult,
)
from app.db.models import Course, Lesson, Module, Progress, Quiz, QuizAttempt, Subtopic


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------


async def create_course(db: AsyncSession, plan: LearningPlanOutput, language: str = "en") -> Course:
    course = Course(
        topic=plan.topic,
        level=plan.level,
        goal=plan.goal,
        estimated_hours=plan.estimated_hours,
        status="building",
        language=language,
    )
    db.add(course)
    await db.flush()
    return course


async def set_course_ready(db: AsyncSession, course_id: int) -> None:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if course:
        course.status = "ready"


async def get_course(db: AsyncSession, course_id: int) -> Course | None:
    # Use select() instead of db.get() so that selectinload options are always
    # applied — db.get() may return a cached identity-map object and skip the
    # eager-load query, causing MissingGreenlet errors on async engines.
    result = await db.execute(
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.modules).selectinload(Module.subtopics))
    )
    return result.scalar_one_or_none()


async def list_courses(db: AsyncSession) -> list[Course]:
    result = await db.execute(select(Course).order_by(Course.created_at.desc()))
    return list(result.scalars().all())


async def delete_course(db: AsyncSession, course_id: int) -> bool:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if not course:
        return False
    await db.delete(course)
    await db.flush()
    return True


# ---------------------------------------------------------------------------
# Modules & Subtopics (populated from CourseBlueprint)
# ---------------------------------------------------------------------------


async def persist_blueprint(db: AsyncSession, course_id: int, blueprint: CourseBlueprint) -> None:
    for module_order, module_bp in enumerate(blueprint.modules):
        module = Module(
            course_id=course_id,
            name=module_bp.name,
            order=module_order,
            blueprint_json=module_bp.model_dump_json(),
        )
        db.add(module)
        await db.flush()

        for sub_order, sub_bp in enumerate(module_bp.subtopics):
            subtopic = Subtopic(
                module_id=module.id,
                name=sub_bp.name,
                order=sub_order,
                lesson_prompt=sub_bp.lesson_prompt,
                # Only the first subtopic of each module is unlocked at start
                unlocked=(sub_order == 0),
            )
            db.add(subtopic)

    await db.flush()


async def get_subtopic(db: AsyncSession, subtopic_id: int) -> Subtopic | None:
    result = await db.execute(select(Subtopic).where(Subtopic.id == subtopic_id))
    return result.scalar_one_or_none()


async def unlock_subtopic(db: AsyncSession, subtopic_id: int) -> None:
    result = await db.execute(select(Subtopic).where(Subtopic.id == subtopic_id))
    subtopic = result.scalar_one_or_none()
    if subtopic:
        subtopic.unlocked = True


async def get_next_subtopic(db: AsyncSession, current_subtopic_id: int) -> Subtopic | None:
    result = await db.execute(select(Subtopic).where(Subtopic.id == current_subtopic_id))
    current = result.scalar_one_or_none()
    if not current:
        return None
    result = await db.execute(
        select(Subtopic)
        .where(Subtopic.module_id == current.module_id, Subtopic.order == current.order + 1)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Lessons
# ---------------------------------------------------------------------------


async def get_lesson(db: AsyncSession, subtopic_id: int) -> Lesson | None:
    result = await db.execute(select(Lesson).where(Lesson.subtopic_id == subtopic_id))
    return result.scalar_one_or_none()


async def save_lesson(db: AsyncSession, subtopic_id: int, content: LessonContent, validated: bool = True) -> Lesson:
    lesson = Lesson(
        subtopic_id=subtopic_id,
        content_json=content.model_dump_json(),
        validated_at=datetime.now(timezone.utc) if validated else None,
    )
    db.add(lesson)

    subtopic = await db.get(Subtopic, subtopic_id)
    if subtopic:
        subtopic.lesson_status = "validated" if validated else "generated"

    await db.flush()
    return lesson


# ---------------------------------------------------------------------------
# Quizzes
# ---------------------------------------------------------------------------


async def get_quiz(db: AsyncSession, subtopic_id: int, quiz_type: str = "subtopic") -> Quiz | None:
    result = await db.execute(
        select(Quiz).where(Quiz.subtopic_id == subtopic_id, Quiz.type == quiz_type)
    )
    return result.scalar_one_or_none()


async def save_quiz(db: AsyncSession, subtopic_id: int, quiz: QuizOutput, validated: bool = True) -> Quiz:
    db_quiz = Quiz(
        subtopic_id=subtopic_id,
        type="subtopic",
        questions_json=quiz.model_dump_json(),
        validated_at=datetime.now(timezone.utc) if validated else None,
    )
    db.add(db_quiz)

    subtopic = await db.get(Subtopic, subtopic_id)
    if subtopic:
        subtopic.quiz_status = "validated" if validated else "generated"

    await db.flush()
    return db_quiz


async def save_final_quiz(db: AsyncSession, subtopic_id: int, questions_json: str) -> Quiz:
    db_quiz = Quiz(
        subtopic_id=subtopic_id,
        type="final",
        questions_json=questions_json,
        validated_at=datetime.now(timezone.utc),
    )
    db.add(db_quiz)
    await db.flush()
    return db_quiz


# ---------------------------------------------------------------------------
# Quiz Attempts & Progress
# ---------------------------------------------------------------------------


async def record_attempt(
    db: AsyncSession,
    quiz_id: int,
    answers: list[int],
    score: float,
    weak_topics: list[str],
) -> QuizAttempt:
    attempt = QuizAttempt(
        quiz_id=quiz_id,
        answers_json=json.dumps(answers),
        score=score,
        weak_topics_json=json.dumps(weak_topics),
    )
    db.add(attempt)
    await db.flush()
    return attempt


async def upsert_progress(
    db: AsyncSession,
    course_id: int,
    subtopic_id: int,
    quiz_score: float,
    completed: bool,
) -> Progress:
    result = await db.execute(
        select(Progress).where(
            Progress.course_id == course_id,
            Progress.subtopic_id == subtopic_id,
        )
    )
    prog = result.scalar_one_or_none()
    if prog:
        prog.quiz_score = quiz_score
        prog.completed = completed
    else:
        prog = Progress(
            course_id=course_id,
            subtopic_id=subtopic_id,
            quiz_score=quiz_score,
            completed=completed,
        )
        db.add(prog)
    await db.flush()
    return prog


async def get_course_progress(db: AsyncSession, course_id: int) -> list[Progress]:
    result = await db.execute(
        select(Progress)
        .where(Progress.course_id == course_id)
        .options(selectinload(Progress.subtopic))
    )
    return list(result.scalars().all())


async def get_subtopic_attempts(db: AsyncSession, subtopic_id: int) -> list[QuizAttempt]:
    result = await db.execute(
        select(QuizAttempt)
        .join(Quiz, QuizAttempt.quiz_id == Quiz.id)
        .where(Quiz.subtopic_id == subtopic_id)
        .order_by(QuizAttempt.created_at.desc())
    )
    return list(result.scalars().all())


async def get_validation_result(db: AsyncSession, result: ValidationResult) -> ValidationResult:
    return result

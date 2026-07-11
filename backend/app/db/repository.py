"""Repository layer — all database access goes through here."""

import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.constants import ContentStatus, CourseStatus, QuizType
from app.db.models import Course, Lesson, Module, Progress, Quiz, QuizAttempt, Subtopic, User, UserApiKey


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


async def get_user_by_auth0_id(db: AsyncSession, auth0_user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.auth0_user_id == auth0_user_id))
    return result.scalar_one_or_none()


async def upsert_user_from_auth0(
    db: AsyncSession,
    *,
    auth0_user_id: str,
    email: str | None,
    name: str | None,
    picture: str | None,
) -> User:
    now = datetime.now(timezone.utc)
    user = await get_user_by_auth0_id(db, auth0_user_id)
    if user:
        user.email = email
        user.name = name
        user.picture = picture
        user.last_login = now
    else:
        user = User(
            auth0_user_id=auth0_user_id,
            email=email,
            name=name,
            picture=picture,
            created_at=now,
            last_login=now,
        )
        db.add(user)
    await db.flush()
    return user


# ---------------------------------------------------------------------------
# API keys
# ---------------------------------------------------------------------------


async def get_user_api_key(db: AsyncSession, user_id: int) -> UserApiKey | None:
    result = await db.execute(select(UserApiKey).where(UserApiKey.user_id == user_id))
    return result.scalar_one_or_none()


async def upsert_user_api_key(
    db: AsyncSession,
    user_id: int,
    encrypted_key: bytes,
    key_last4: str,
) -> UserApiKey:
    now = datetime.now(timezone.utc)
    record = await get_user_api_key(db, user_id)
    if record:
        record.encrypted_key = encrypted_key
        record.key_last4 = key_last4
        record.updated_at = now
    else:
        record = UserApiKey(
            user_id=user_id,
            encrypted_key=encrypted_key,
            key_last4=key_last4,
            created_at=now,
            updated_at=now,
        )
        db.add(record)
    await db.flush()
    return record


async def delete_user_api_key(db: AsyncSession, user_id: int) -> bool:
    record = await get_user_api_key(db, user_id)
    if not record:
        return False
    await db.delete(record)
    await db.flush()
    return True


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------


async def create_course(
    db: AsyncSession,
    *,
    topic: str,
    level: str,
    goal: str,
    estimated_hours: int,
    language: str = "en",
    user_id: int | None = None,
) -> Course:
    course = Course(
        topic=topic,
        level=level,
        goal=goal,
        estimated_hours=estimated_hours,
        status=CourseStatus.BUILDING,
        language=language,
        user_id=user_id,
    )
    db.add(course)
    await db.flush()
    return course


async def set_course_ready(db: AsyncSession, course_id: int) -> None:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if course:
        course.status = CourseStatus.READY


async def get_course(db: AsyncSession, course_id: int, user_id: int | None = None) -> Course | None:
    query = (
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.modules).selectinload(Module.subtopics))
    )
    if user_id is not None:
        query = query.where(Course.user_id == user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_owned_course(db: AsyncSession, course_id: int, user_id: int) -> Course | None:
    return await get_course(db, course_id, user_id=user_id)


async def list_courses(db: AsyncSession, user_id: int) -> list[Course]:
    result = await db.execute(
        select(Course)
        .where(Course.user_id == user_id)
        .order_by(Course.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_course(db: AsyncSession, course_id: int, user_id: int) -> bool:
    result = await db.execute(
        select(Course).where(Course.id == course_id, Course.user_id == user_id)
    )
    course = result.scalar_one_or_none()
    if not course:
        return False
    await db.delete(course)
    await db.flush()
    return True


# ---------------------------------------------------------------------------
# Modules & Subtopics
# ---------------------------------------------------------------------------


async def persist_blueprint(db: AsyncSession, course_id: int, blueprint_json: str) -> None:
    blueprint = json.loads(blueprint_json)
    for module_order, module_bp in enumerate(blueprint.get("modules", [])):
        module = Module(
            course_id=course_id,
            name=module_bp["name"],
            order=module_order,
            blueprint_json=json.dumps(module_bp),
        )
        db.add(module)
        await db.flush()

        for sub_order, sub_bp in enumerate(module_bp.get("subtopics", [])):
            subtopic = Subtopic(
                module_id=module.id,
                name=sub_bp["name"],
                order=sub_order,
                lesson_prompt=sub_bp.get("lesson_prompt"),
                unlocked=(sub_order == 0),
            )
            db.add(subtopic)

    await db.flush()


async def get_subtopic(db: AsyncSession, subtopic_id: int) -> Subtopic | None:
    result = await db.execute(select(Subtopic).where(Subtopic.id == subtopic_id))
    return result.scalar_one_or_none()


async def get_subtopic_for_course(
    db: AsyncSession,
    course_id: int,
    subtopic_id: int,
) -> Subtopic | None:
    result = await db.execute(
        select(Subtopic)
        .join(Module, Subtopic.module_id == Module.id)
        .where(Subtopic.id == subtopic_id, Module.course_id == course_id)
    )
    return result.scalar_one_or_none()


async def get_module_for_course(
    db: AsyncSession,
    course_id: int,
    module_id: int,
) -> Module | None:
    result = await db.execute(
        select(Module)
        .where(Module.id == module_id, Module.course_id == course_id)
        .options(selectinload(Module.subtopics))
    )
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


async def save_lesson(
    db: AsyncSession,
    subtopic_id: int,
    content_json: str,
    validated: bool = True,
) -> Lesson:
    lesson = Lesson(
        subtopic_id=subtopic_id,
        content_json=content_json,
        validated_at=datetime.now(timezone.utc) if validated else None,
    )
    db.add(lesson)

    subtopic = await db.get(Subtopic, subtopic_id)
    if subtopic:
        subtopic.lesson_status = (
            ContentStatus.VALIDATED if validated else ContentStatus.GENERATED
        )

    await db.flush()
    return lesson


# ---------------------------------------------------------------------------
# Quizzes
# ---------------------------------------------------------------------------


async def get_quiz(
    db: AsyncSession,
    subtopic_id: int,
    quiz_type: str = QuizType.SUBTOPIC,
) -> Quiz | None:
    result = await db.execute(
        select(Quiz).where(Quiz.subtopic_id == subtopic_id, Quiz.type == quiz_type)
    )
    return result.scalar_one_or_none()


async def save_quiz(
    db: AsyncSession,
    subtopic_id: int,
    questions_json: str,
    validated: bool = True,
) -> Quiz:
    db_quiz = Quiz(
        subtopic_id=subtopic_id,
        type=QuizType.SUBTOPIC,
        questions_json=questions_json,
        validated_at=datetime.now(timezone.utc) if validated else None,
    )
    db.add(db_quiz)

    subtopic = await db.get(Subtopic, subtopic_id)
    if subtopic:
        subtopic.quiz_status = (
            ContentStatus.VALIDATED if validated else ContentStatus.GENERATED
        )

    await db.flush()
    return db_quiz


async def save_final_quiz(db: AsyncSession, subtopic_id: int, questions_json: str) -> Quiz:
    db_quiz = Quiz(
        subtopic_id=subtopic_id,
        type=QuizType.FINAL,
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

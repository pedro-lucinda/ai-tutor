"""Course lifecycle and progress routes."""

import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.ai_tutor.services.course_service import (
    CachedContent,
    GeneratedStream,
    create_course_stream,
    resolve_final_test,
    resolve_lesson,
    resolve_quiz,
)
from app.agents.ai_tutor.services.progress_service import get_progress_report, submit_quiz
from app.auth import CurrentUser, get_current_user
from app.constants import QuizType
from app.db import repository as repo
from app.db.engine import get_db
from app.limiter import limiter
from app.routes.deps import (
    map_api_key_error,
    require_owned_course,
    resolve_lang,
    sse_stream,
)
from app.serializers.course import serialize_course_detail, serialize_course_list_item
from app.services.errors import ApiKeyNotFoundError

courses_router = APIRouter(prefix="/courses", tags=["courses"])


class CreateCourseRequest(BaseModel):
    goal: str
    lang: Literal["en", "pt-BR"] = "en"


class SubmitAnswersRequest(BaseModel):
    answers: list[int]


# ---------------------------------------------------------------------------
# Course endpoints
# ---------------------------------------------------------------------------


@courses_router.post("")
@limiter.limit("3/hour")
async def create_course_endpoint(
    request: Request,
    body: CreateCourseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Run the full course-creation pipeline — always streams SSE events."""
    try:
        return sse_stream(
            create_course_stream(db, current_user.id, body.goal, lang=body.lang)
        )
    except ApiKeyNotFoundError as exc:
        raise map_api_key_error(exc) from exc


@courses_router.get("")
async def list_courses_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    courses = await repo.list_courses(db, current_user.id)
    return [serialize_course_list_item(course) for course in courses]


@courses_router.get("/{course_id}")
async def get_course_endpoint(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    course = await require_owned_course(db, course_id, current_user)
    return serialize_course_detail(course)


@courses_router.delete("/{course_id}", status_code=204)
async def delete_course_endpoint(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    deleted = await repo.delete_course(db, course_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.commit()


# ---------------------------------------------------------------------------
# Lesson — streams SSE when generating, returns JSON immediately when cached
# ---------------------------------------------------------------------------


@courses_router.get("/{course_id}/subtopics/{subtopic_id}/lesson")
async def get_or_generate_lesson_endpoint(
    course_id: int,
    subtopic_id: int,
    lang: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Return the lesson for a subtopic; streams progress when generating."""
    course = await require_owned_course(db, course_id, current_user)

    subtopic = await repo.get_subtopic_for_course(db, course_id, subtopic_id)
    if not subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    if not subtopic.unlocked:
        raise HTTPException(
            status_code=403,
            detail="Subtopic is locked. Complete the previous subtopic first.",
        )

    resolved_lang = resolve_lang(course.language, lang)
    try:
        result = await resolve_lesson(
            db, current_user.id, subtopic, course.level, lang=resolved_lang
        )
    except ApiKeyNotFoundError as exc:
        raise map_api_key_error(exc) from exc

    if isinstance(result, CachedContent):
        return result.data
    return sse_stream(result.iterator)


# ---------------------------------------------------------------------------
# Quiz — streams SSE when generating, returns JSON immediately when cached
# ---------------------------------------------------------------------------


@courses_router.get("/{course_id}/subtopics/{subtopic_id}/quiz")
async def get_or_generate_quiz_endpoint(
    course_id: int,
    subtopic_id: int,
    lang: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Return the quiz for a subtopic; streams progress when generating."""
    course = await require_owned_course(db, course_id, current_user)

    subtopic = await repo.get_subtopic_for_course(db, course_id, subtopic_id)
    if not subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    if not subtopic.unlocked:
        raise HTTPException(status_code=403, detail="Subtopic is locked.")

    resolved_lang = resolve_lang(course.language, lang)
    try:
        result = await resolve_quiz(
            db, current_user.id, subtopic, course.level, lang=resolved_lang
        )
    except ApiKeyNotFoundError as exc:
        raise map_api_key_error(exc) from exc

    if isinstance(result, CachedContent):
        return result.data
    return sse_stream(result.iterator)


# ---------------------------------------------------------------------------
# Final test — streams SSE when generating, returns JSON immediately when cached
# ---------------------------------------------------------------------------


@courses_router.get("/{course_id}/modules/{module_id}/final-test")
async def get_or_generate_final_test_endpoint(
    course_id: int,
    module_id: int,
    lang: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Return the final test for a module; streams progress when generating."""
    course = await require_owned_course(db, course_id, current_user)

    module = await repo.get_module_for_course(db, course_id, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    resolved_lang = resolve_lang(course.language, lang)
    try:
        result = await resolve_final_test(
            db,
            current_user.id,
            course_id,
            course.level,
            module.name,
            module.subtopics,
            lang=resolved_lang,
        )
    except ApiKeyNotFoundError as exc:
        raise map_api_key_error(exc) from exc

    if isinstance(result, CachedContent):
        return result.data
    return sse_stream(result.iterator)


# ---------------------------------------------------------------------------
# Quiz submission
# ---------------------------------------------------------------------------


@courses_router.post("/{course_id}/subtopics/{subtopic_id}/quiz/submit")
async def submit_quiz_endpoint(
    course_id: int,
    subtopic_id: int,
    request: SubmitAnswersRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Submit answers for a subtopic quiz."""
    await require_owned_course(db, course_id, current_user)

    subtopic = await repo.get_subtopic_for_course(db, course_id, subtopic_id)
    if not subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")

    quiz = await repo.get_quiz(db, subtopic_id, QuizType.SUBTOPIC)
    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="No quiz found. Fetch GET /courses/{course_id}/subtopics/{subtopic_id}/quiz first.",
        )

    attempt, unlocked_next = await submit_quiz(
        db=db,
        course_id=course_id,
        subtopic=subtopic,
        quiz=quiz,
        answers=request.answers,
    )

    return {
        "score": attempt.score,
        "score_percent": round(attempt.score * 100, 1),
        "passed": attempt.score >= 0.60,
        "unlocked_next_subtopic": unlocked_next,
        "weak_topics": json.loads(attempt.weak_topics_json),
    }


@courses_router.post("/{course_id}/modules/{module_id}/final-test/submit")
async def submit_final_test_endpoint(
    course_id: int,
    module_id: int,
    request: SubmitAnswersRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Submit answers for a module final test."""
    await require_owned_course(db, course_id, current_user)

    module = await repo.get_module_for_course(db, course_id, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    if not module.subtopics:
        raise HTTPException(status_code=422, detail="Module has no subtopics.")

    quiz = await repo.get_quiz(db, module.subtopics[0].id, QuizType.FINAL)
    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="No final test found. Fetch GET /courses/{course_id}/modules/{module_id}/final-test first.",
        )

    attempt, _ = await submit_quiz(
        db=db,
        course_id=course_id,
        subtopic=module.subtopics[0],
        quiz=quiz,
        answers=request.answers,
    )

    score = attempt.score
    mastery = "review" if score < 0.60 else "pass" if score < 0.80 else "mastered"

    return {
        "score": score,
        "score_percent": round(score * 100, 1),
        "mastery": mastery,
        "weak_topics": json.loads(attempt.weak_topics_json),
    }


# ---------------------------------------------------------------------------
# Progress report
# ---------------------------------------------------------------------------


@courses_router.get("/{course_id}/progress")
async def get_progress_endpoint(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Return a progress report with completion %, weak topics, and LLM recommendation."""
    await require_owned_course(db, course_id, current_user)

    try:
        report = await get_progress_report(db, course_id, current_user.id)
    except ApiKeyNotFoundError as exc:
        raise map_api_key_error(exc) from exc
    return report.model_dump()

"""Course lifecycle routes — creation, structure, on-demand lesson/quiz generation."""

import json
from typing import AsyncIterator, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.ai_tutor.services.course_service import (
    create_course_stream,
    generate_final_test_stream,
    get_or_generate_lesson_stream,
    get_or_generate_quiz_stream,
)
from app.auth import CurrentUser, get_current_user
from app.db.engine import get_db
from app.db import repository as repo
from app.limiter import limiter
from app.services.errors import ApiKeyNotFoundError

courses_router = APIRouter(prefix="/courses", tags=["courses"])

SUPPORTED_LANGUAGES = {"en", "pt-BR"}

_SSE_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


class CreateCourseRequest(BaseModel):
    goal: str
    lang: Literal["en", "pt-BR"] = "en"


def _resolve_lang(course_lang: str, query_lang: str | None) -> str:
    """Use query param if it's a known language, otherwise fall back to the course's language."""
    if query_lang and query_lang in SUPPORTED_LANGUAGES:
        return query_lang
    return course_lang if course_lang in SUPPORTED_LANGUAGES else "en"


def _sse_stream(generator: AsyncIterator[str]) -> StreamingResponse:
    return StreamingResponse(generator, media_type="text/event-stream", headers=_SSE_HEADERS)


async def _require_owned_course(
    db: AsyncSession,
    course_id: int,
    current_user: CurrentUser,
):
    course = await repo.get_owned_course(db, course_id, current_user.id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _map_api_key_error(exc: ApiKeyNotFoundError) -> HTTPException:
    return HTTPException(status_code=400, detail=str(exc) or "Please add your OpenAI API key.")


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
        return _sse_stream(
            create_course_stream(db, current_user.id, body.goal, lang=body.lang)
        )
    except ApiKeyNotFoundError as exc:
        raise _map_api_key_error(exc) from exc


@courses_router.get("")
async def list_courses_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    courses = await repo.list_courses(db, current_user.id)
    return [
        {"id": c.id, "topic": c.topic, "level": c.level, "status": c.status}
        for c in courses
    ]


@courses_router.get("/{course_id}")
async def get_course_endpoint(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    course = await _require_owned_course(db, course_id, current_user)
    return {
        "id": course.id,
        "topic": course.topic,
        "level": course.level,
        "goal": course.goal,
        "estimated_hours": course.estimated_hours,
        "status": course.status,
        "language": course.language,
        "modules": [
            {
                "id": m.id,
                "name": m.name,
                "order": m.order,
                "subtopics": [
                    {
                        "id": s.id,
                        "name": s.name,
                        "order": s.order,
                        "unlocked": s.unlocked,
                        "lesson_status": s.lesson_status,
                        "quiz_status": s.quiz_status,
                    }
                    for s in sorted(m.subtopics, key=lambda x: x.order)
                ],
            }
            for m in sorted(course.modules, key=lambda x: x.order)
        ],
    }


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
    course = await _require_owned_course(db, course_id, current_user)

    subtopic = await repo.get_subtopic(db, subtopic_id)
    if not subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    if not subtopic.unlocked:
        raise HTTPException(status_code=403, detail="Subtopic is locked. Complete the previous subtopic first.")

    existing = await repo.get_lesson(db, subtopic_id)
    if existing:
        return json.loads(existing.content_json)

    resolved_lang = _resolve_lang(course.language, lang)
    try:
        return _sse_stream(
            get_or_generate_lesson_stream(
                db, current_user.id, subtopic, course.level, lang=resolved_lang
            )
        )
    except ApiKeyNotFoundError as exc:
        raise _map_api_key_error(exc) from exc


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
    course = await _require_owned_course(db, course_id, current_user)

    subtopic = await repo.get_subtopic(db, subtopic_id)
    if not subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    if not subtopic.unlocked:
        raise HTTPException(status_code=403, detail="Subtopic is locked.")

    existing = await repo.get_quiz(db, subtopic_id, "subtopic")
    if existing:
        return json.loads(existing.questions_json)

    lesson = await repo.get_lesson(db, subtopic_id)
    lesson_json = lesson.content_json if lesson else None

    resolved_lang = _resolve_lang(course.language, lang)
    try:
        return _sse_stream(
            get_or_generate_quiz_stream(
                db,
                current_user.id,
                subtopic,
                course.level,
                lesson_json,
                lang=resolved_lang,
            )
        )
    except ApiKeyNotFoundError as exc:
        raise _map_api_key_error(exc) from exc


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
    course = await _require_owned_course(db, course_id, current_user)

    module = next((m for m in course.modules if m.id == module_id), None)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if module.subtopics:
        existing = await repo.get_quiz(db, module.subtopics[0].id, "final")
        if existing:
            return json.loads(existing.questions_json)

    progress_records = await repo.get_course_progress(db, course_id)
    weak_names = [
        p.subtopic.name
        for p in progress_records
        if p.subtopic and p.quiz_score is not None and p.quiz_score < 0.70
    ]

    resolved_lang = _resolve_lang(course.language, lang)
    try:
        return _sse_stream(
            generate_final_test_stream(
                db=db,
                user_id=current_user.id,
                module_id=module_id,
                course_level=course.level,
                module_name=module.name,
                subtopics=module.subtopics,
                weak_topic_names=weak_names,
                lang=resolved_lang,
            )
        )
    except ApiKeyNotFoundError as exc:
        raise _map_api_key_error(exc) from exc

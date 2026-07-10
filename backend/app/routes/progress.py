"""Progress and quiz submission routes."""

import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.ai_tutor.services.progress_service import get_progress_report, submit_quiz
from app.auth import CurrentUser, get_current_user
from app.db.engine import get_db
from app.db import repository as repo
from app.services.errors import ApiKeyNotFoundError

progress_router = APIRouter(prefix="/courses", tags=["progress"])


class SubmitAnswersRequest(BaseModel):
    answers: list[int]


async def _require_owned_course(db: AsyncSession, course_id: int, current_user: CurrentUser):
    course = await repo.get_owned_course(db, course_id, current_user.id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@progress_router.post("/{course_id}/subtopics/{subtopic_id}/quiz/submit")
async def submit_quiz_endpoint(
    course_id: int,
    subtopic_id: int,
    request: SubmitAnswersRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Submit answers for a subtopic quiz. Returns score, pass/fail, and whether the next subtopic was unlocked."""
    await _require_owned_course(db, course_id, current_user)

    subtopic = await repo.get_subtopic(db, subtopic_id)
    if not subtopic:
        raise HTTPException(status_code=404, detail="Subtopic not found")

    quiz = await repo.get_quiz(db, subtopic_id, "subtopic")
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


@progress_router.post("/{course_id}/modules/{module_id}/final-test/submit")
async def submit_final_test_endpoint(
    course_id: int,
    module_id: int,
    request: SubmitAnswersRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Submit answers for a module final test. Returns score and mastery level: review / pass / mastered."""
    course = await _require_owned_course(db, course_id, current_user)

    module = next((m for m in course.modules if m.id == module_id), None)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if not module.subtopics:
        raise HTTPException(status_code=422, detail="Module has no subtopics.")

    quiz = await repo.get_quiz(db, module.subtopics[0].id, "final")
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


@progress_router.get("/{course_id}/progress")
async def get_progress_endpoint(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Return a progress report with completion %, weak topics, and LLM recommendation."""
    await _require_owned_course(db, course_id, current_user)

    try:
        report = await get_progress_report(db, course_id, current_user.id)
    except ApiKeyNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc) or "Please add your OpenAI API key.") from exc
    return report.model_dump()

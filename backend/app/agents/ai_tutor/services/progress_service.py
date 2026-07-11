"""Progress service — deterministic scoring, unlock logic, and LLM-powered recommendations."""

import json

from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.ai_tutor.schemas.progress import ProgressReport, WeakTopic
from app.db import repository as repo
from app.db.models import Progress, Quiz, QuizAttempt, Subtopic
from app.agents.ai_tutor.client_factory import ai_client_factory

PASS_THRESHOLD = 0.60      # minimum score to unlock next subtopic
WEAK_TOPIC_THRESHOLD = 0.70  # below this average → flagged as weak


def _score_attempt(quiz_json: str, answers: list[int]) -> tuple[float, list[str]]:
    """Compute score (0–1) and list of subtopic names where the learner was wrong.

    Returns (score, weak_topic_names). weak_topic_names contains the quiz's subtopic
    once for each wrong answer — the caller aggregates across attempts.
    """
    from app.agents.ai_tutor.schemas.quiz import QuizOutput

    quiz = QuizOutput.model_validate_json(quiz_json)
    if not quiz.questions:
        return 1.0, []

    correct = sum(
        1
        for i, q in enumerate(quiz.questions)
        if i < len(answers) and answers[i] == q.correct_index
    )
    score = correct / len(quiz.questions)
    wrong_subtopic = [quiz.subtopic] * (len(quiz.questions) - correct)
    return score, wrong_subtopic


async def submit_quiz(
    db: AsyncSession,
    course_id: int,
    subtopic: Subtopic,
    quiz: Quiz,
    answers: list[int],
) -> tuple[QuizAttempt, bool]:
    """Score a quiz attempt, record it, update progress, and unlock the next subtopic if passed.

    Returns (attempt, unlocked_next) — unlocked_next is True when the next subtopic was unlocked.
    """
    score, weak_topics = _score_attempt(quiz.questions_json, answers)

    attempt = await repo.record_attempt(
        db,
        quiz_id=quiz.id,
        answers=answers,
        score=score,
        weak_topics=weak_topics,
    )

    passed = score >= PASS_THRESHOLD
    await repo.upsert_progress(
        db,
        course_id=course_id,
        subtopic_id=subtopic.id,
        quiz_score=score,
        completed=passed,
    )

    unlocked_next = False
    if passed:
        next_subtopic = await repo.get_next_subtopic(db, subtopic.id)
        if next_subtopic and not next_subtopic.unlocked:
            await repo.unlock_subtopic(db, next_subtopic.id)
            unlocked_next = True

    await db.commit()
    return attempt, unlocked_next


async def get_progress_report(db: AsyncSession, course_id: int, user_id: int) -> ProgressReport:
    """Compute progress metrics and generate LLM recommendation."""
    course = await repo.get_course(db, course_id, user_id=user_id)
    all_progress: list[Progress] = await repo.get_course_progress(db, course_id)
    total_subtopics = (
        sum(len(module.subtopics) for module in course.modules)
        if course
        else 0
    )

    if not all_progress:
        return ProgressReport(
            course_id=course_id,
            completion_percent=0.0,
            completed_subtopics=[],
            weak_topics=[],
            recommendation="You haven't started yet — pick a module and begin!",
        )

    completed = [p for p in all_progress if p.completed]
    completion_percent = (
        (len(completed) / total_subtopics) * 100
        if total_subtopics
        else 0.0
    )
    completed_names = [p.subtopic.name for p in completed if p.subtopic]

    # Aggregate weak topics across all progress records
    weak_map: dict[str, list[float]] = {}
    for p in all_progress:
        if p.quiz_score is not None and p.subtopic:
            name = p.subtopic.name
            weak_map.setdefault(name, []).append(p.quiz_score)

    weak_topics = [
        WeakTopic(
            subtopic=name,
            average_score=sum(scores) / len(scores),
            attempts=len(scores),
        )
        for name, scores in weak_map.items()
        if (sum(scores) / len(scores)) < WEAK_TOPIC_THRESHOLD
    ]

    # Ask the LLM for a personalised recommendation
    api_key = await ai_client_factory.require_openai_key(db, user_id)
    agent = ai_client_factory.make_progress_agent(api_key)
    partial = ProgressReport(
        course_id=course_id,
        completion_percent=completion_percent,
        completed_subtopics=completed_names,
        weak_topics=weak_topics,
        recommendation="",
    )
    prompt = (
        f"Provide a recommendation for a learner with this progress:\n"
        f"{partial.model_dump_json(indent=2)}"
    )
    result = await agent.ainvoke({"messages": [HumanMessage(content=prompt)]})
    enriched: ProgressReport | None = result.get("structured_response")

    if enriched:
        return enriched.model_copy(
            update={
                "course_id": course_id,
                "completion_percent": completion_percent,
                "completed_subtopics": completed_names,
                "weak_topics": weak_topics,
            }
        )

    return partial.model_copy(update={"recommendation": "Keep going — you're making progress!"})

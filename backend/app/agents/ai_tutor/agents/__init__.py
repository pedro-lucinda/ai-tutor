"""Public DeepAgent factories for the AI tutor domain."""

from app.agents.ai_tutor.agents.course_creation import make_course_creation_agent
from app.agents.ai_tutor.agents.lesson import make_lesson_agent
from app.agents.ai_tutor.agents.progress import make_progress_agent
from app.agents.ai_tutor.agents.quiz import make_final_test_agent, make_quiz_agent

__all__ = [
    "make_course_creation_agent",
    "make_final_test_agent",
    "make_lesson_agent",
    "make_progress_agent",
    "make_quiz_agent",
]

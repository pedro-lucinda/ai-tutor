"""On-demand lesson, quiz, and final-test agents using DeepAgents."""

from deepagents import create_deep_agent

from app.agents.ai_tutor.prompts.content_generator import CONTENT_GENERATOR_PROMPT
from app.agents.ai_tutor.prompts.quiz_generator import FINAL_TEST_PROMPT, QUIZ_GENERATOR_PROMPT
from app.agents.ai_tutor.schemas.lesson import LessonContent
from app.agents.ai_tutor.schemas.quiz import FinalTestOutput, QuizOutput


def make_lesson_agent():
    # Single direct agent — lesson quality is ensured at curriculum build time.
    return create_deep_agent(
        model="openai:gpt-4o-mini",
        system_prompt=CONTENT_GENERATOR_PROMPT,
        response_format=LessonContent,
    )


def make_quiz_agent():
    # Single direct agent (no supervisor loop, no validator) for faster quiz generation.
    return create_deep_agent(
        model="openai:gpt-4o",
        system_prompt=QUIZ_GENERATOR_PROMPT,
        response_format=QuizOutput,
    )


def make_final_test_agent():
    # A single direct agent (no supervisor loop, no validator) keeps final-test
    # generation fast and avoids the recursion the multi-agent flow was prone to.
    return create_deep_agent(
        model="openai:gpt-4o",
        system_prompt=FINAL_TEST_PROMPT,
        response_format=FinalTestOutput,
    )

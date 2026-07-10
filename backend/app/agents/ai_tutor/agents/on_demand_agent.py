"""On-demand lesson, quiz, and final-test supervisor agents using DeepAgents."""

from deepagents import SubAgent, create_deep_agent

from app.agents.ai_tutor.prompts.content_generator import CONTENT_GENERATOR_PROMPT
from app.agents.ai_tutor.prompts.on_demand_supervisor import (
    ON_DEMAND_LESSON_PROMPT,
    ON_DEMAND_QUIZ_PROMPT,
)
from app.agents.ai_tutor.prompts.quiz_generator import FINAL_TEST_PROMPT, QUIZ_GENERATOR_PROMPT
from app.agents.ai_tutor.prompts.validation import VALIDATION_PROMPT
from app.agents.ai_tutor.schemas.lesson import LessonContent
from app.agents.ai_tutor.schemas.quiz import FinalTestOutput, QuizOutput
from app.agents.ai_tutor.schemas.validation import ValidationResult
from app.agents.ai_tutor.tools.code_validator import validate_code_example


def make_lesson_agent():
    return create_deep_agent(
        model="openai:gpt-5-mini",
        system_prompt=ON_DEMAND_LESSON_PROMPT,
        response_format=LessonContent,
        subagents=[
            SubAgent(
                name="content-generator",
                description=(
                    "Generates a complete structured lesson (introduction and in-depth explanation) "
                    "for a given subtopic and level."
                ),
                system_prompt=CONTENT_GENERATOR_PROMPT,
                response_format=LessonContent,
            ),
            SubAgent(
                name="validator",
                description=(
                    "Quality-checks generated lesson content for factual accuracy, completeness, "
                    "and code validity. Returns passed=True or a list of issues to fix."
                ),
                system_prompt=VALIDATION_PROMPT,
                tools=[validate_code_example],
                response_format=ValidationResult,
            ),
        ],
    )


def make_quiz_agent():
    return create_deep_agent(
        model="openai:gpt-4o",
        system_prompt=ON_DEMAND_QUIZ_PROMPT,
        response_format=QuizOutput,
        subagents=[
            SubAgent(
                name="quiz-generator",
                description=(
                    "Generates exactly 3 multiple-choice quiz questions for a subtopic lesson, "
                    "with 4 options each and one correct answer."
                ),
                system_prompt=QUIZ_GENERATOR_PROMPT,
                response_format=QuizOutput,
            ),
            SubAgent(
                name="validator",
                description=(
                    "Quality-checks generated quiz questions for structural correctness, "
                    "distractor plausibility, and answer accuracy."
                ),
                system_prompt=VALIDATION_PROMPT,
                tools=[validate_code_example],
                response_format=ValidationResult,
            ),
        ],
    )


def make_final_test_agent():
    # A single direct agent (no supervisor loop, no validator) keeps final-test
    # generation fast and avoids the recursion the multi-agent flow was prone to.
    return create_deep_agent(
        model="openai:gpt-4o",
        system_prompt=FINAL_TEST_PROMPT,
        response_format=FinalTestOutput,
    )

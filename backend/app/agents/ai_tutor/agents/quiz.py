"""On-demand quiz and final-test agents using DeepAgents."""

from deepagents import create_deep_agent
from langchain_openai import ChatOpenAI

from app.agents.ai_tutor.prompts.quiz import FINAL_TEST_PROMPT, QUIZ_GENERATOR_PROMPT
from app.agents.ai_tutor.schemas.quiz import FinalTestOutput, QuizOutput


def make_quiz_agent(api_key: str):
    return create_deep_agent(
        model=ChatOpenAI(model="gpt-4o", api_key=api_key),
        system_prompt=QUIZ_GENERATOR_PROMPT,
        response_format=QuizOutput,
    )


def make_final_test_agent(api_key: str):
    return create_deep_agent(
        model=ChatOpenAI(model="gpt-4o", api_key=api_key),
        system_prompt=FINAL_TEST_PROMPT,
        response_format=FinalTestOutput,
    )

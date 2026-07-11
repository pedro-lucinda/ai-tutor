"""On-demand lesson agent using DeepAgents."""

from deepagents import create_deep_agent
from langchain_openai import ChatOpenAI

from app.agents.ai_tutor.prompts.lesson import LESSON_PROMPT
from app.agents.ai_tutor.schemas.lesson import LessonContent


def make_lesson_agent(api_key: str):
    return create_deep_agent(
        model=ChatOpenAI(model="gpt-4o-mini", api_key=api_key),
        system_prompt=LESSON_PROMPT,
        response_format=LessonContent,
    )

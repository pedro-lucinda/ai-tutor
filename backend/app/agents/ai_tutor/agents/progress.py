from deepagents import create_deep_agent
from langchain_openai import ChatOpenAI

from app.agents.ai_tutor.prompts.progress import PROGRESS_PROMPT
from app.agents.ai_tutor.schemas.progress import ProgressReport


def make_progress_agent(api_key: str, model: str = "gpt-4o"):
    return create_deep_agent(
        model=ChatOpenAI(model=model, api_key=api_key),
        system_prompt=PROGRESS_PROMPT,
        response_format=ProgressReport,
    )

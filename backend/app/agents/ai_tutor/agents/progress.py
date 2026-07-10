from deepagents import create_deep_agent

from app.agents.ai_tutor.prompts.progress import PROGRESS_PROMPT
from app.agents.ai_tutor.schemas.progress import ProgressReport


def make_progress_agent(model: str = "openai:gpt-4o"):
    return create_deep_agent(
        model=model,
        system_prompt=PROGRESS_PROMPT,
        response_format=ProgressReport,
    )

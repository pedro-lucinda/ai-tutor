from typing import Literal

from pydantic import BaseModel, Field, field_validator

ALLOWED_LEVELS = ("Beginner", "Intermediate", "Advanced")


class LearningPlanOutput(BaseModel):
    """Structured output from the Learning Planner Agent."""

    topic: str = Field(description="The subject being learned (e.g. 'Python')")
    level: Literal["Beginner", "Intermediate", "Advanced"] = Field(
        description="Inferred skill level: Beginner, Intermediate, or Advanced"
    )
    goal: str = Field(description="The learner's stated or inferred goal (e.g. 'Become job-ready')")
    estimated_hours: int = Field(description="Total estimated hours to complete the course")
    modules: list[str] = Field(description="Ordered list of module names for the course")

    @field_validator("level", mode="before")
    @classmethod
    def normalize_level(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if "beginner" in cleaned:
            return "Beginner"
        if "intermediate" in cleaned:
            return "Intermediate"
        if "advanced" in cleaned:
            return "Advanced"
        return "Beginner"

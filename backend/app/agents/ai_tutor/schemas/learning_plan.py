from pydantic import BaseModel, Field


class LearningPlanOutput(BaseModel):
    """Structured output from the Learning Planner Agent."""

    topic: str = Field(description="The subject being learned (e.g. 'Python')")
    level: str = Field(description="Inferred skill level: Beginner, Intermediate, or Advanced")
    goal: str = Field(description="The learner's stated or inferred goal (e.g. 'Become job-ready')")
    estimated_hours: int = Field(description="Total estimated hours to complete the course")
    modules: list[str] = Field(description="Ordered list of module names for the course")

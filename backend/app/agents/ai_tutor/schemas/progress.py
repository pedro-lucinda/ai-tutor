from pydantic import BaseModel, Field


class WeakTopic(BaseModel):
    subtopic: str
    average_score: float
    attempts: int


class ProgressReport(BaseModel):
    """Structured output from the Progress Agent."""

    course_id: int
    completion_percent: float = Field(description="Overall course completion percentage (0–100)")
    completed_subtopics: list[str] = Field(description="Names of subtopics the learner has passed")
    weak_topics: list[WeakTopic] = Field(
        description="Subtopics where the learner's average quiz score is below 70%",
        default_factory=list,
    )
    recommendation: str = Field(
        description="Natural-language recommendation for what the learner should focus on next"
    )

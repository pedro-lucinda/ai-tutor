from pydantic import BaseModel, Field


class LessonContent(BaseModel):
    """Structured lesson output from the Content Generator Agent for one subtopic."""

    subtopic: str = Field(description="Name of the subtopic this lesson covers")
    introduction: str = Field(description="Brief motivating introduction (1-2 paragraphs)")
    explanation: str = Field(
        description=(
            "In-depth conceptual explanation: 4-7 paragraphs going deep on the topic, "
            "using analogies and inline examples where helpful"
        )
    )

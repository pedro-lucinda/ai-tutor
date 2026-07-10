from pydantic import BaseModel, Field


class LessonContent(BaseModel):
    """Structured lesson output from the Content Generator Agent for one subtopic."""

    subtopic: str = Field(description="Name of the subtopic this lesson covers")
    introduction: str = Field(
        description="Brief motivating introduction (2-3 sentences) written as markdown"
    )
    explanation: str = Field(
        description=(
            "In-depth conceptual explanation written as markdown: 4-7 paragraphs going deep "
            "on the topic. Use ### subheadings, fenced code blocks, and bullet lists where helpful."
        )
    )

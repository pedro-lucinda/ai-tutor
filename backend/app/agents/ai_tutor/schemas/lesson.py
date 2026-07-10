from typing import Any

from pydantic import BaseModel, Field, field_validator


def _bullet_list_to_string(value: Any) -> str:
    if isinstance(value, list):
        lines: list[str] = []
        for item in value:
            text = str(item).strip()
            if not text:
                continue
            if text[0] not in "-•*":
                text = f"• {text}"
            lines.append(text)
        return "\n".join(lines)
    if value is None:
        return ""
    return str(value)


class LessonContent(BaseModel):
    """Structured lesson output from the Content Generator Agent for one subtopic."""

    subtopic: str = Field(description="Name of the subtopic this lesson covers")
    introduction: str = Field(description="Brief motivating introduction (1-2 paragraphs)")
    explanation: str = Field(description="Core conceptual explanation with clear examples")
    example: str = Field(
        description="A complete, self-contained code or worked example. For programming topics, include runnable code."
    )
    common_mistakes: str = Field(
        description="2-4 bullet points describing common errors learners make and how to avoid them"
    )
    summary: str = Field(description="3-5 bullet points capturing the most important takeaways")

    @field_validator("common_mistakes", "summary", mode="before")
    @classmethod
    def normalize_bullet_fields(cls, value: Any) -> str:
        return _bullet_list_to_string(value)

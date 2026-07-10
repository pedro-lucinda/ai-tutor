from pydantic import BaseModel, Field


class ValidationResult(BaseModel):
    """Structured output from the Validation Agent."""

    passed: bool = Field(description="True if all checks passed; False if any issue was found")
    issues: list[str] = Field(
        description="List of problems found (empty when passed=True)",
        default_factory=list,
    )
    section_to_regenerate: str | None = Field(
        default=None,
        description=(
            "Which section of the lesson or quiz needs to be regenerated. "
            "One of: 'introduction', 'explanation', 'questions', or None."
        ),
    )

from pydantic import BaseModel, Field


class SubtopicBlueprint(BaseModel):
    """Teaching plan for one subtopic."""

    name: str = Field(description="Subtopic name")
    lesson_steps: list[str] = Field(
        description=(
            "Ordered teaching steps for this subtopic, e.g. "
            "['What is a function', 'Parameters', 'Return values', 'Scope', 'Practice', 'Quiz']"
        )
    )


class ModuleBlueprint(BaseModel):
    """Teaching plan for one module."""

    name: str = Field(description="Module name")
    subtopics: list[SubtopicBlueprint] = Field(description="Ordered subtopics with their lesson steps")


class CourseBlueprint(BaseModel):
    """Full structured teaching plan produced by the Course Builder Agent."""

    topic: str
    level: str
    modules: list[ModuleBlueprint] = Field(description="All modules in order")

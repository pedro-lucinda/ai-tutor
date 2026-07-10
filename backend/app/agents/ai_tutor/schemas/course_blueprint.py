from pydantic import BaseModel, Field


class SubtopicBlueprint(BaseModel):
    """Teaching plan for one subtopic."""

    name: str = Field(description="Subtopic name")
    lesson_prompt: str = Field(
        description=(
            "Detailed instructions for generating this subtopic's lesson: "
            "concepts to cover, depth, analogies, inline code examples, "
            "common pitfalls to mention, and how it connects to prior subtopics."
        )
    )


class ModuleBlueprint(BaseModel):
    """Teaching plan for one module."""

    name: str = Field(description="Module name")
    subtopics: list[SubtopicBlueprint] = Field(
        description="Ordered subtopics with their lesson generation prompts"
    )


class CourseBlueprint(BaseModel):
    """Full structured teaching plan produced by the Course Builder Agent."""

    topic: str
    level: str
    modules: list[ModuleBlueprint] = Field(description="All modules in order")

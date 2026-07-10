from pydantic import BaseModel, Field


class CurriculumModuleOutput(BaseModel):
    """Structured output from the Curriculum Research Agent for one module."""

    module: str = Field(description="Name of the module being researched")
    subtopics: list[str] = Field(description="Ordered list of subtopic names within this module")
    sources: list[str] = Field(
        description="URLs or titles of authoritative sources consulted (docs, syllabi, bootcamps)",
        default_factory=list,
    )

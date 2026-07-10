from pydantic import BaseModel

from app.agents.ai_tutor.schemas.course_blueprint import CourseBlueprint
from app.agents.ai_tutor.schemas.learning_plan import LearningPlanOutput


class CourseCreationOutput(BaseModel):
    """Combined output from the CourseCreation supervisor."""

    plan: LearningPlanOutput
    blueprint: CourseBlueprint

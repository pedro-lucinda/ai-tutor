"""Course-creation supervisor using DeepAgents.

Execution sequence (coordinated by the supervisor):
  learning-planner → curriculum-researcher (once per module) → course-builder
"""

from typing import AsyncIterator

from langchain_core.messages import HumanMessage

from deepagents import SubAgent, create_deep_agent

from app.agents.ai_tutor.streaming import stream_agent

from app.agents.ai_tutor.prompts.course_builder import COURSE_BUILDER_PROMPT
from app.agents.ai_tutor.prompts.course_creation_supervisor import COURSE_CREATION_SUPERVISOR_PROMPT
from app.agents.ai_tutor.prompts.curriculum_research import CURRICULUM_RESEARCH_PROMPT
from app.agents.ai_tutor.prompts.learning_planner import LEARNING_PLANNER_PROMPT
from app.agents.ai_tutor.schemas.course_blueprint import CourseBlueprint
from app.agents.ai_tutor.schemas.course_creation import CourseCreationOutput
from app.agents.ai_tutor.schemas.curriculum import CurriculumModuleOutput
from app.agents.ai_tutor.schemas.learning_plan import LearningPlanOutput
from app.agents.ai_tutor.tools.web_search import internet_search


LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "pt-BR": "Portuguese (Brazil)",
}


def _language_instruction(lang: str) -> str:
    name = LANGUAGE_NAMES.get(lang, "English")
    return f"\n\nIMPORTANT: Write ALL output in {name}. Every field, name, and description must be in {name}."


def _make_course_creation_agent():
    return create_deep_agent(
        model="openai:gpt-4o",
        system_prompt=COURSE_CREATION_SUPERVISOR_PROMPT,
        response_format=CourseCreationOutput,
        subagents=[
            SubAgent(
                name="learning-planner",
                description=(
                    "Analyzes the learner's goal and produces a structured learning roadmap "
                    "with topic, level, estimated hours, and an ordered list of module names."
                ),
                system_prompt=LEARNING_PLANNER_PROMPT,
                response_format=LearningPlanOutput,
            ),
            SubAgent(
                name="curriculum-researcher",
                description=(
                    "Researches the best subtopics for a single module by searching official "
                    "docs, bootcamps, and syllabi. Call once per module."
                ),
                system_prompt=CURRICULUM_RESEARCH_PROMPT,
                tools=[internet_search],
                response_format=CurriculumModuleOutput,
            ),
            SubAgent(
                name="course-builder",
                description=(
                    "Assembles the final CourseBlueprint with ordered lesson steps for every "
                    "subtopic, given the learning plan and all researched curricula."
                ),
                system_prompt=COURSE_BUILDER_PROMPT,
                response_format=CourseBlueprint,
            ),
        ],
    )


async def run_course_creation(user_goal: str, lang: str = "en") -> CourseCreationOutput:
    """Run the full course-creation pipeline and return a CourseCreationOutput.

    Persistence (saving to DB) is handled by the caller (course_service.py)
    to keep this module framework-agnostic.
    """
    agent = _make_course_creation_agent()
    result = await agent.ainvoke({
        "messages": [HumanMessage(content=user_goal + _language_instruction(lang))]
    })
    output: CourseCreationOutput = result.get("structured_response")
    return output


async def run_course_creation_stream(
    user_goal: str,
    lang: str = "en",
) -> AsyncIterator[tuple[str, CourseCreationOutput | None]]:
    """Streaming variant of run_course_creation.

    Yields (sse_line, None) for progress events, then yields
    (complete_sse_line, CourseCreationOutput) as the final tuple so the
    caller (course_service) can persist the result to the DB.
    """
    agent = _make_course_creation_agent()
    agent_input = {"messages": [HumanMessage(content=user_goal + _language_instruction(lang))]}

    async for sse_line, output in stream_agent(agent, agent_input):
        yield sse_line, output

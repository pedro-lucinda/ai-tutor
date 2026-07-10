from pydantic import BaseModel, Field


class QuizQuestion(BaseModel):
    """A single multiple-choice question."""

    question: str = Field(description="The question text")
    options: list[str] = Field(description="Exactly 4 answer options (A, B, C, D content)")
    correct_index: int = Field(description="0-based index of the correct option in `options`")
    explanation: str = Field(description="Brief explanation of why the correct answer is right")


class QuizOutput(BaseModel):
    """Structured output from the Quiz Generator Agent — exactly 3 MCQ questions per subtopic."""

    subtopic: str = Field(description="The subtopic this quiz covers")
    questions: list[QuizQuestion] = Field(description="Exactly 3 multiple-choice questions")


class FinalTestOutput(BaseModel):
    """Structured output from the Final Test Agent — ~10 MCQ questions covering a full module."""

    module: str = Field(description="Module name this final test covers")
    questions: list[QuizQuestion] = Field(
        description="About 10 questions, balanced across all subtopics in the module"
    )

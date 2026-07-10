"""SQLAlchemy ORM models for the AI Tutor knowledge tree."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.engine import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    topic: Mapped[str] = mapped_column(String(256))
    level: Mapped[str] = mapped_column(String(64))
    goal: Mapped[str] = mapped_column(Text)
    estimated_hours: Mapped[int] = mapped_column(Integer)
    # 'pending' | 'building' | 'ready'
    status: Mapped[str] = mapped_column(String(32), default="pending")
    # BCP 47 language tag, e.g. 'en' or 'pt-BR'
    language: Mapped[str] = mapped_column(String(16), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    modules: Mapped[list["Module"]] = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    progress_records: Mapped[list["Progress"]] = relationship(
        "Progress", back_populates="course", cascade="all, delete-orphan"
    )


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(256))
    order: Mapped[int] = mapped_column(Integer)
    # JSON-encoded ModuleBlueprint from the Course Builder Agent
    blueprint_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    course: Mapped["Course"] = relationship("Course", back_populates="modules")
    subtopics: Mapped[list["Subtopic"]] = relationship(
        "Subtopic", back_populates="module", cascade="all, delete-orphan"
    )


class Subtopic(Base):
    __tablename__ = "subtopics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(256))
    order: Mapped[int] = mapped_column(Integer)
    # 'pending' | 'generated' | 'validated'
    lesson_status: Mapped[str] = mapped_column(String(32), default="pending")
    quiz_status: Mapped[str] = mapped_column(String(32), default="pending")
    unlocked: Mapped[bool] = mapped_column(default=True)

    module: Mapped["Module"] = relationship("Module", back_populates="subtopics")
    lesson: Mapped["Lesson | None"] = relationship(
        "Lesson",
        back_populates="subtopic",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    quizzes: Mapped[list["Quiz"]] = relationship("Quiz", back_populates="subtopic", cascade="all, delete-orphan")
    progress_records: Mapped[list["Progress"]] = relationship(
        "Progress",
        back_populates="subtopic",
        passive_deletes=True,
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subtopic_id: Mapped[int] = mapped_column(ForeignKey("subtopics.id", ondelete="CASCADE"), unique=True)
    # JSON-encoded LessonContent
    content_json: Mapped[str] = mapped_column(Text)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    subtopic: Mapped["Subtopic"] = relationship("Subtopic", back_populates="lesson")


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subtopic_id: Mapped[int] = mapped_column(ForeignKey("subtopics.id", ondelete="CASCADE"))
    # 'subtopic' | 'final'
    type: Mapped[str] = mapped_column(String(16), default="subtopic")
    # JSON-encoded QuizOutput or FinalTestOutput
    questions_json: Mapped[str] = mapped_column(Text)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    subtopic: Mapped["Subtopic"] = relationship("Subtopic", back_populates="quizzes")
    attempts: Mapped[list["QuizAttempt"]] = relationship(
        "QuizAttempt", back_populates="quiz", cascade="all, delete-orphan"
    )


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"))
    # JSON list of chosen indices
    answers_json: Mapped[str] = mapped_column(Text)
    score: Mapped[float] = mapped_column(Float)
    # JSON list of subtopic names where learner answered incorrectly
    weak_topics_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="attempts")


class Progress(Base):
    __tablename__ = "progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    subtopic_id: Mapped[int] = mapped_column(ForeignKey("subtopics.id", ondelete="CASCADE"))
    quiz_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    completed: Mapped[bool] = mapped_column(default=False)
    time_spent_sec: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    course: Mapped["Course"] = relationship("Course", back_populates="progress_records")
    subtopic: Mapped["Subtopic"] = relationship("Subtopic", back_populates="progress_records")

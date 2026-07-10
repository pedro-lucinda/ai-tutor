"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-09
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "courses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("topic", sa.String(256), nullable=False),
        sa.Column("level", sa.String(64), nullable=False),
        sa.Column("goal", sa.Text, nullable=False),
        sa.Column("estimated_hours", sa.Integer, nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "modules",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("order", sa.Integer, nullable=False),
        sa.Column("blueprint_json", sa.Text, nullable=True),
    )

    op.create_table(
        "subtopics",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("module_id", sa.Integer, sa.ForeignKey("modules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("order", sa.Integer, nullable=False),
        sa.Column("lesson_status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("quiz_status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("unlocked", sa.Boolean, nullable=False, server_default="true"),
    )

    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "subtopic_id",
            sa.Integer,
            sa.ForeignKey("subtopics.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("content_json", sa.Text, nullable=False),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "quizzes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("subtopic_id", sa.Integer, sa.ForeignKey("subtopics.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(16), nullable=False, server_default="subtopic"),
        sa.Column("questions_json", sa.Text, nullable=False),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("quiz_id", sa.Integer, sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("answers_json", sa.Text, nullable=False),
        sa.Column("score", sa.Float, nullable=False),
        sa.Column("weak_topics_json", sa.Text, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "progress",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("course_id", sa.Integer, sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subtopic_id", sa.Integer, sa.ForeignKey("subtopics.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quiz_score", sa.Float, nullable=True),
        sa.Column("completed", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("time_spent_sec", sa.Integer, nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Useful indices
    op.create_index("ix_modules_course_id", "modules", ["course_id"])
    op.create_index("ix_subtopics_module_id", "subtopics", ["module_id"])
    op.create_index("ix_progress_course_id", "progress", ["course_id"])
    op.create_index("ix_quizzes_subtopic_id", "quizzes", ["subtopic_id"])
    op.create_index("ix_quiz_attempts_quiz_id", "quiz_attempts", ["quiz_id"])


def downgrade() -> None:
    op.drop_table("progress")
    op.drop_table("quiz_attempts")
    op.drop_table("quizzes")
    op.drop_table("lessons")
    op.drop_table("subtopics")
    op.drop_table("modules")
    op.drop_table("courses")

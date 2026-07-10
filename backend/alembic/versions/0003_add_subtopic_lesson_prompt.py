"""Add lesson_prompt column to subtopics

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "subtopics",
        sa.Column("lesson_prompt", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("subtopics", "lesson_prompt")

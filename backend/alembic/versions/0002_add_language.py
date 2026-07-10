"""Add language column to courses

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-09
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "courses",
        sa.Column("language", sa.String(16), nullable=False, server_default="en"),
    )


def downgrade() -> None:
    op.drop_column("courses", "language")

"""Add user_id to courses

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_courses_user_id_users",
        "courses",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_courses_user_id", "courses", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_courses_user_id", table_name="courses")
    op.drop_constraint("fk_courses_user_id_users", "courses", type_="foreignkey")
    op.drop_column("courses", "user_id")

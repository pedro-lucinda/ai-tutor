"""Add users table

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("auth0_user_id", sa.String(length=128), nullable=False),
        sa.Column("email", sa.String(length=256), nullable=True),
        sa.Column("name", sa.String(length=256), nullable=True),
        sa.Column("picture", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_auth0_user_id", "users", ["auth0_user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_auth0_user_id", table_name="users")
    op.drop_table("users")

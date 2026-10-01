"""entitlements cache table for RevenueCat

Revision ID: 002
Revises: 001
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002_entitlements"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "entitlements",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("product_id", sa.String()),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("checked_at", sa.DateTime(timezone=True)),
        sa.Column("source", sa.String()),
    )


def downgrade():
    op.drop_table("entitlements")

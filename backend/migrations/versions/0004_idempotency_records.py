"""Add response storage for retry-safe mutation requests.

Revision ID: 0004_idempotency_records
Revises: 0003_unique_medicine_name
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "0004_idempotency_records"
down_revision = "0003_unique_medicine_name"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if not inspector.has_table("idempotency_records"):
        op.create_table(
            "idempotency_records",
            sa.Column("key", sa.String(length=128), primary_key=True),
            sa.Column("status_code", sa.Integer(), nullable=False),
            sa.Column("response_body", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if inspector.has_table("idempotency_records"):
        op.drop_table("idempotency_records")
"""Add strength and dosage_form to medicines.

Revision ID: 0005_add_strength_form
Revises: 0004_idempotency_records
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "0005_add_strength_form"
down_revision = "0004_idempotency_records"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = [col["name"] for col in inspector.get_columns("medicines")]

    if "strength" not in existing_columns:
        op.add_column(
            "medicines",
            sa.Column("strength", sa.String(length=100), nullable=True),
        )

    if "dosage_form" not in existing_columns:
        op.add_column(
            "medicines",
            sa.Column("dosage_form", sa.String(length=100), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = [col["name"] for col in inspector.get_columns("medicines")]

    if "dosage_form" in existing_columns:
        op.drop_column("medicines", "dosage_form")

    if "strength" in existing_columns:
        op.drop_column("medicines", "strength")

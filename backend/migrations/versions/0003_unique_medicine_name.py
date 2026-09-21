"""Prevent duplicate medicine catalog entries under concurrent writes.

Revision ID: 0003_unique_medicine_name
Revises: 0002_fix_patient_column_types
"""
from alembic import op
from sqlalchemy import inspect


revision = "0003_unique_medicine_name"
down_revision = "0002_fix_patient_column_types"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    existing_constraints = [c.get("name") for c in inspector.get_unique_constraints("medicines")]
    existing_indexes = [i.get("name") for i in inspector.get_indexes("medicines")]

    if "uq_medicines_medicine_name" not in existing_constraints and "uq_medicines_medicine_name" not in existing_indexes:
        try:
            op.create_unique_constraint(
                "uq_medicines_medicine_name",
                "medicines",
                ["medicine_name"],
            )
        except Exception as exc:
            if "already exists" not in str(exc).lower():
                raise


def downgrade() -> None:
    try:
        op.drop_constraint("uq_medicines_medicine_name", "medicines", type_="unique")
    except Exception:
        pass
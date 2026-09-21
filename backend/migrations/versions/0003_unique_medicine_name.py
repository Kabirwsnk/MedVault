"""Prevent duplicate medicine catalog entries under concurrent writes.

Revision ID: 0003_unique_medicine_name
Revises: 0002_fix_patient_column_types
"""
from alembic import op


revision = "0003_unique_medicine_name"
down_revision = "0002_fix_patient_column_types"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The database constraint closes the race left by an application-only check.
    op.create_unique_constraint(
        "uq_medicines_medicine_name",
        "medicines",
        ["medicine_name"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_medicines_medicine_name", "medicines", type_="unique")
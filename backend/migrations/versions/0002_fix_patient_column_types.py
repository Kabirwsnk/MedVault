"""Fix swapped blood_group / date_of_birth column types on patients.

blood_group was incorrectly declared as DATE, date_of_birth as VARCHAR.
This migration corrects both columns to their proper types.

Revision ID: 0002_fix_patient_column_types
Revises: 0001_baseline_schema
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_fix_patient_column_types"
down_revision = "0001_baseline_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. blood_group: DATE → VARCHAR
    #    Any existing DATE values are cast to text so nothing is lost.
    op.alter_column(
        "patients",
        "blood_group",
        existing_type=sa.Date(),
        type_=sa.String(),
        existing_nullable=True,
        postgresql_using="blood_group::text",
    )

    # 2. date_of_birth: VARCHAR → DATE
    #    Existing ISO-8601 strings (YYYY-MM-DD) are cast to date.
    #    Malformed rows will cause a hard error – review data before running.
    op.alter_column(
        "patients",
        "date_of_birth",
        existing_type=sa.String(),
        type_=sa.Date(),
        existing_nullable=True,
        postgresql_using="date_of_birth::date",
    )


def downgrade() -> None:
    # Revert to the original (incorrect) types.
    op.alter_column(
        "patients",
        "date_of_birth",
        existing_type=sa.Date(),
        type_=sa.String(),
        existing_nullable=True,
        postgresql_using="date_of_birth::text",
    )
    op.alter_column(
        "patients",
        "blood_group",
        existing_type=sa.String(),
        type_=sa.Date(),
        existing_nullable=True,
        postgresql_using="blood_group::date",
    )

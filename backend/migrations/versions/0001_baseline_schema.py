"""Create the MedVault baseline schema.

For an existing pre-Alembic database, take a backup, run a schema comparison,
then stamp this revision only after applying the documented reconciliation.
"""
from alembic import op

from app.database import Base
from app.models.inventory_movement import InventoryMovement  # noqa: F401
from app.models.medical_record import MedicalRecord  # noqa: F401
from app.models.medicine import Medicine  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.prescription import Prescription  # noqa: F401
from app.models.user import User  # noqa: F401

revision = "0001_baseline_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())

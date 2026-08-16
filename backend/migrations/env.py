from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import DATABASE_URL
from app.database import Base
from app.models.inventory_movement import InventoryMovement  # noqa: F401
from app.models.medical_record import MedicalRecord  # noqa: F401
from app.models.medicine import Medicine  # noqa: F401
from app.models.patient import Patient  # noqa: F401
from app.models.prescription import Prescription  # noqa: F401
from app.models.user import User  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", DATABASE_URL)
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(url=DATABASE_URL, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

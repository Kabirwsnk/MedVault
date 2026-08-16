from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'doctor', 'registration_worker', 'pharmacy', 'patient')",
            name="ck_users_role",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    patient = relationship(
        "Patient",
        back_populates="user",
        foreign_keys="Patient.user_id",
        uselist=False
    )

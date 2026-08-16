from sqlalchemy import CheckConstraint, Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = (
        CheckConstraint("height_cm IS NULL OR height_cm > 0", name="ck_patients_height_positive"),
        CheckConstraint("weight_kg IS NULL OR weight_kg > 0", name="ck_patients_weight_positive"),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    beneficiary_id = Column(
        String,
        unique=True,
        nullable=False
    )

    full_name = Column(
        String,
        nullable=False
    )

    phone_number = Column(
        String,
        nullable=False
    )

    aadhar_number = Column(
        String,
        unique=True,
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        unique=True,
        nullable=True
    )

    blood_group = Column(
        Date,
        nullable=True
    )

    date_of_birth = Column(
        String,
        nullable=True
    )

    gender = Column(
        String,
        nullable=True
    )

    height_cm = Column(
        Integer,
        nullable=True
    )

    weight_kg = Column(
        Integer,
        nullable=True
    )

    emergency_contact = Column(
        String,
        nullable=True
    )

    records = relationship(
        "MedicalRecord",
        back_populates="patient"
    )

    user = relationship(
        "User",
        back_populates="patient",
        foreign_keys=[user_id],
        uselist=False
    )

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

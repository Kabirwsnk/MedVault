from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

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
        ForeignKey("users.id"),
        unique=True,
        nullable=True
    )

    blood_group = Column(
        String,
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
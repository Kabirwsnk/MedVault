from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        Integer,
        ForeignKey("patients.id")
    )

    diagnosis = Column(
        String,
        nullable=False
    )

    prescription = Column(
        String,
        nullable=False
    )

    notes = Column(
        String,
        nullable=True
    )

    patient = relationship(
        "Patient",
        back_populates="records"
    )
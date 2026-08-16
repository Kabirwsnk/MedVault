from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
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
        ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    doctor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
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

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    patient = relationship(
        "Patient",
        back_populates="records"
    )

    prescriptions = relationship(
        "Prescription",
        back_populates="medical_record",
    )

    doctor = relationship("User", foreign_keys=[doctor_id])

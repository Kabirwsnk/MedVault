from sqlalchemy import Column, Integer, String, ForeignKey

from sqlalchemy.orm import relationship

from app.database import Base

from sqlalchemy import Boolean, DateTime
from datetime import datetime

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)

    medical_record_id = Column(
        Integer,
        ForeignKey("medical_records.id")
    )

    medicine_id = Column(
        Integer,
        ForeignKey("medicines.id")
    )

    quantity = Column(Integer)

    dosage = Column(String)

    duration = Column(String)

    # NEW COLUMNS
    dispensed = Column(
        Boolean,
        default=False
    )

    dispensed_at = Column(
        DateTime,
        nullable=True
    )

    medical_record = relationship(
        "MedicalRecord",
        back_populates="prescriptions"
    )

    medicine = relationship(
        "Medicine",
        back_populates="prescriptions"
    )
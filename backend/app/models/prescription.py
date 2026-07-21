from sqlalchemy import Column, Integer, String, ForeignKey

from sqlalchemy.orm import relationship

from app.database import Base


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

    medical_record = relationship(
        "MedicalRecord",
        back_populates="prescriptions"
    )

    medicine = relationship(
        "Medicine",
        back_populates="prescriptions"
    )
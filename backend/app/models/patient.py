from sqlalchemy import Column, Integer, String  # type: ignore
from app.database import Base
from sqlalchemy.orm import relationship  # type: ignore


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)

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

    records = relationship(
        "MedicalRecord",
        back_populates="patient"
    )
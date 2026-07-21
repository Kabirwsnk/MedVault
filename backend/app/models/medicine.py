from sqlalchemy import Column, Integer, String

from app.database import Base

from sqlalchemy.orm import relationship


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    medicine_name = Column(
        String,
        nullable=False
    )

    manufacturer = Column(
        String,
        nullable=False
    )

    unit = Column(
        String,
        nullable=False
    )

    stock = Column(
        Integer,
        default=0
    )
    
    prescriptions = relationship(
    "Prescription",
    back_populates="medicine"
    )
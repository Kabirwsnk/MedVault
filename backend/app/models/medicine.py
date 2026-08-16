from sqlalchemy import CheckConstraint, Column, DateTime, Integer, String, func

from app.database import Base

from sqlalchemy.orm import relationship


class Medicine(Base):
    __tablename__ = "medicines"
    __table_args__ = (CheckConstraint("stock >= 0", name="ck_medicines_stock_nonnegative"),)

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
        nullable=False,
        default=0,
        server_default="0",
    )

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    
    prescriptions = relationship("Prescription", back_populates="medicine")
    inventory_movements = relationship("InventoryMovement", back_populates="medicine")

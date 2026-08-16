from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, func

from sqlalchemy.orm import relationship

from app.database import Base

class Prescription(Base):
    __tablename__ = "prescriptions"
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_prescriptions_quantity_positive"),)

    id = Column(Integer, primary_key=True, index=True)

    medical_record_id = Column(
        Integer,
        ForeignKey("medical_records.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    medicine_id = Column(
        Integer,
        ForeignKey("medicines.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    quantity = Column(Integer, nullable=False)

    dosage = Column(String, nullable=False)

    duration = Column(String, nullable=False)

    # NEW COLUMNS
    dispensed = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    dispensed_at = Column(
        DateTime,
        nullable=True
    )

    dispensed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    medical_record = relationship(
        "MedicalRecord",
        back_populates="prescriptions"
    )

    medicine = relationship(
        "Medicine",
        back_populates="prescriptions"
    )

    dispensed_by = relationship("User", foreign_keys=[dispensed_by_user_id])
    inventory_movement = relationship("InventoryMovement", back_populates="prescription", uselist=False)

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    __table_args__ = (
        CheckConstraint("quantity != 0", name="ck_inventory_movements_quantity_nonzero"),
    )

    id = Column(Integer, primary_key=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="RESTRICT"), nullable=False, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="RESTRICT"), nullable=True, unique=True)
    performed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    movement_type = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    stock_before = Column(Integer, nullable=False)
    stock_after = Column(Integer, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    medicine = relationship("Medicine", back_populates="inventory_movements")
    prescription = relationship("Prescription", back_populates="inventory_movement")
    performed_by = relationship("User", foreign_keys=[performed_by_user_id])

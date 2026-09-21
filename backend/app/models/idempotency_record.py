from sqlalchemy import Column, DateTime, Integer, JSON, String, func

from app.database import Base


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    key = Column(String(128), primary_key=True)
    status_code = Column(Integer, nullable=False)
    response_body = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
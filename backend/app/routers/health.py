from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.database import async_engine

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Expose dependency health without requiring authentication."""
    try:
        async with async_engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": "unavailable", "detail": str(exc)},
        )

    return {"status": "ok", "database": "available"}
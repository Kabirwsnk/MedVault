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


@router.get("/health/seed")
async def seed_endpoint():
    """Idempotently seed demo accounts and catalog into the connected database."""
    try:
        from app.manage import seed_demo
        seed_demo(ensure_tables=True)
        return {"status": "ok", "message": "Demo data successfully seeded"}
    except Exception as exc:
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(exc)})
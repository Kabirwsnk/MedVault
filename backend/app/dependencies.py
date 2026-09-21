from collections.abc import AsyncIterator, Iterator

from app.database import AsyncSessionLocal, SessionLocal


def get_db() -> Iterator:
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


async def get_async_db() -> AsyncIterator:
    db = AsyncSessionLocal()

    try:
        yield db
    finally:
        await db.close()
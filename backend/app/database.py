from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import (
    DATABASE_URL,
    DB_MAX_OVERFLOW,
    DB_POOL_RECYCLE,
    DB_POOL_SIZE,
    DB_POOL_TIMEOUT,
)

# Pool capacity should be tuned with worker count, database limits, and expected
# concurrent users when this service is deployed beyond the local demo.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=DB_POOL_SIZE,
    max_overflow=DB_MAX_OVERFLOW,
    pool_timeout=DB_POOL_TIMEOUT,
    pool_recycle=DB_POOL_RECYCLE,
)

ASYNC_DATABASE_URL = DATABASE_URL
if ASYNC_DATABASE_URL.startswith("postgresql+psycopg2://"):
    ASYNC_DATABASE_URL = ASYNC_DATABASE_URL.replace(
        "postgresql+psycopg2://", "postgresql+asyncpg://", 1
    )
elif ASYNC_DATABASE_URL.startswith("postgresql://"):
    ASYNC_DATABASE_URL = ASYNC_DATABASE_URL.replace(
        "postgresql://", "postgresql+asyncpg://", 1
    )
elif ASYNC_DATABASE_URL.startswith("sqlite:///"):
    ASYNC_DATABASE_URL = ASYNC_DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

async_connect_args = {}

if "postgresql+asyncpg://" in ASYNC_DATABASE_URL:
    import ssl as _ssl
    from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

    parsed = urlparse(ASYNC_DATABASE_URL)
    query_params = parse_qs(parsed.query)

    # Check if SSL was requested in query or host is remote
    ssl_mode = query_params.get("sslmode", [None])[0] or query_params.get("ssl", [None])[0]

    # Strip ALL query parameters (such as channel_binding, sslmode, gssencmode, etc.)
    # because asyncpg does not accept libpq query string parameters
    ASYNC_DATABASE_URL = urlunparse(parsed._replace(query=""))

    is_remote = parsed.hostname and not (
        parsed.hostname in ("localhost", "127.0.0.1")
        or parsed.hostname.endswith(".internal")
        or (parsed.hostname.startswith("dpg-") and "." not in parsed.hostname)
    )
    if ssl_mode in ("require", "verify-ca", "verify-full") or is_remote:
        ctx = _ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = _ssl.CERT_NONE
        async_connect_args["ssl"] = ctx

# Async sessions let FastAPI yield the event loop while PostgreSQL handles I/O.
async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    connect_args=async_connect_args,
    pool_pre_ping=True,
    pool_size=DB_POOL_SIZE,
    max_overflow=DB_MAX_OVERFLOW,
    pool_timeout=DB_POOL_TIMEOUT,
    pool_recycle=DB_POOL_RECYCLE,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


"""Runtime configuration loaded from the environment."""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()


def required_setting(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Required environment variable {name} is not configured")
    return value


DATABASE_URL = required_setting("DATABASE_URL")
JWT_SECRET_KEY = required_setting("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
LOW_STOCK_THRESHOLD = int(os.getenv("LOW_STOCK_THRESHOLD", "20"))
CRITICAL_STOCK_THRESHOLD = int(os.getenv("CRITICAL_STOCK_THRESHOLD", "10"))

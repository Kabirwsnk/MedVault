from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import RATE_LIMIT_STORAGE_URI

# Redis-backed storage can coordinate limits across multiple API workers in production.
limiter = Limiter(key_func=get_remote_address, storage_uri=RATE_LIMIT_STORAGE_URI)
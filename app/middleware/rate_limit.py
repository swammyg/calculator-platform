import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import get_settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Per-IP fixed-window limiter; Redis is used when the app configured it."""
    def __init__(self, app: object) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self._requests: defaultdict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        if request.url.path == "/api/v1/health":
            return await call_next(request)
        settings = get_settings()
        client = request.client.host if request.client else "unknown"
        key = f"rate:{client}"
        redis = getattr(request.app.state, "redis", None)
        allowed = await self._redis_allowed(redis, key, settings.rate_limit_requests, settings.rate_limit_window_seconds) if redis else self._memory_allowed(key, settings.rate_limit_requests, settings.rate_limit_window_seconds)
        if not allowed:
            return JSONResponse(status_code=429, content={"detail": "rate limit exceeded"}, headers={"Retry-After": str(settings.rate_limit_window_seconds)})
        return await call_next(request)

    @staticmethod
    async def _redis_allowed(redis: object, key: str, limit: int, window: int) -> bool:
        count = await redis.incr(key)  # type: ignore[attr-defined]
        if count == 1:
            await redis.expire(key, window)  # type: ignore[attr-defined]
        return count <= limit

    def _memory_allowed(self, key: str, limit: int, window: int) -> bool:
        now = time.monotonic()
        entries = self._requests[key]
        while entries and entries[0] <= now - window:
            entries.popleft()
        if len(entries) >= limit:
            return False
        entries.append(now)
        return True

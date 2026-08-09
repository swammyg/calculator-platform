import logging
import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncIterator
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware
from app.routes.calculators import router as calculators_router
from app.routes.seo_tools import router as seo_tools_router
from app.routes.time_tools import router as time_tools_router

class JsonFormatter(logging.Formatter):
    """Emit structured logs suitable for CloudWatch and other log aggregators."""
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {"timestamp": self.formatTime(record), "level": record.levelname, "logger": record.name, "message": record.getMessage()}
        for key in ("request_id", "method", "path", "status_code", "duration_ms"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


_handler = logging.StreamHandler()
_handler.setFormatter(JsonFormatter() if get_settings().log_format.lower() == "json" else logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
logging.basicConfig(level=logging.INFO, handlers=[_handler], force=True)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    app.state.redis = None
    if settings.sentry_dsn:
        import sentry_sdk
        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment, traces_sample_rate=0.1)
    if settings.redis_url:
        try:
            from redis.asyncio import Redis
            redis = Redis.from_url(settings.redis_url, decode_responses=True, health_check_interval=30, max_connections=settings.redis_max_connections)
            await redis.ping()
            app.state.redis = redis
            logger.info("Redis cache connected")
        except Exception:
            logger.exception("Redis unavailable; using bounded in-memory cache and rate limiter")
    yield
    redis = app.state.redis
    if redis:
        await redis.aclose()


settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan, docs_url="/docs", redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, allow_credentials=settings.allowed_origins != ["*"], allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization", "X-Request-ID"])
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(calculators_router)
app.include_router(time_tools_router)
app.include_router(seo_tools_router)


def _error_payload(request: Request, detail: object) -> dict[str, object]:
    return {"error": {"detail": detail}, "metadata": {"timestamp": datetime.now(timezone.utc).isoformat(), "id": getattr(request.state, "request_id", str(uuid4()))}, "cached": False}


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content=jsonable_encoder(_error_payload(request, exc.errors())))


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
    """Return expected domain errors in the same JSON envelope as validation errors."""
    return JSONResponse(status_code=exc.status_code, content=jsonable_encoder(_error_payload(request, exc.detail)), headers=exc.headers)


@app.exception_handler(Exception)
async def unhandled_error(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled request error", exc_info=exc)
    return JSONResponse(status_code=500, content=_error_payload(request, "internal server error"))


@app.get("/api/v1/health", tags=["system"])
async def health(request: Request) -> dict[str, object]:
    return {"result": {"status": "ok", "redis_connected": request.app.state.redis is not None}, "metadata": {"timestamp": datetime.now(timezone.utc).isoformat(), "id": getattr(request.state, "request_id", str(uuid4())), "disclaimer": "Service health status only."}, "cached": False}

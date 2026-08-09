from datetime import datetime, timezone
from typing import Any, Awaitable, Callable
from uuid import uuid4

from fastapi import HTTPException, Request
from pydantic import BaseModel

from app.cache import cache

DISCLAIMER = "Results are informational estimates; verify important financial, health, legal, or business decisions independently."


async def cached_response(request: Request, namespace: str, data: BaseModel, calculate: Callable[[], dict[str, object]]) -> dict[str, Any]:
    key = cache.key(namespace, data.model_dump(mode="json"))
    try:
        result = await cache.get(request, key)
        cached = result is not None
        if not cached:
            result = calculate()
            await cache.set(request, key, result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"result": result, "metadata": {"timestamp": datetime.now(timezone.utc).isoformat(), "id": str(uuid4()), "disclaimer": DISCLAIMER}, "cached": cached}

import hashlib
import json
import time
from collections import OrderedDict
from typing import Any

from fastapi import Request

from app.config import get_settings


class Cache:
    def __init__(self, max_entries: int = 1024) -> None:
        self._memory: OrderedDict[str, tuple[float, Any]] = OrderedDict()
        self._max_entries = max_entries

    @staticmethod
    def key(namespace: str, payload: dict[str, Any]) -> str:
        raw = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
        return f"api-cache:{namespace}:{hashlib.sha256(raw.encode()).hexdigest()}"

    async def get(self, request: Request, key: str) -> Any | None:
        redis = getattr(request.app.state, "redis", None)
        if redis:
            value = await redis.get(key)
            return json.loads(value) if value else None
        record = self._memory.get(key)
        if record is None or record[0] <= time.monotonic():
            self._memory.pop(key, None)
            return None
        self._memory.move_to_end(key)
        return record[1]

    async def set(self, request: Request, key: str, value: Any) -> None:
        ttl = get_settings().cache_ttl_seconds
        redis = getattr(request.app.state, "redis", None)
        if redis:
            await redis.set(key, json.dumps(value, default=str), ex=ttl)
            return
        self._memory[key] = (time.monotonic() + ttl, value)
        self._memory.move_to_end(key)
        if len(self._memory) > self._max_entries:
            self._memory.popitem(last=False)


cache = Cache()

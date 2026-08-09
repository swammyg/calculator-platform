"""Cached HTTP endpoints for date and time tools."""
from typing import Any

from fastapi import APIRouter, Request

from app.models.time_tools import AgeCalculatorRequest, CountdownTimerRequest, TimezoneConverterRequest
from app.routes.common import cached_response
from app.services import time_tools_service as service

router = APIRouter(prefix="/api/v1/tools/time", tags=["time tools"])


@router.post("/timezone-converter", summary="Convert time between IANA timezones")
async def timezone_converter(data: TimezoneConverterRequest, request: Request) -> dict[str, Any]:
    """Convert one instant and provide a cached list of 200 current IANA timezone times."""
    return await cached_response(request, "time:timezone-converter", data, lambda: service.timezone_converter(data).model_dump())


@router.post("/age-calculator", summary="Calculate age, zodiac sign, and birthday countdown")
async def age_calculator(data: AgeCalculatorRequest, request: Request) -> dict[str, Any]:
    """Calculate age from an ISO 8601 birth date using the current UTC instant."""
    return await cached_response(request, "time:age-calculator", data, lambda: service.age_calculator(data).model_dump())


@router.post("/countdown-timer", summary="Calculate a future event countdown")
async def countdown_timer(data: CountdownTimerRequest, request: Request) -> dict[str, Any]:
    """Return human-readable units remaining; a past target produces a 422 error."""
    return await cached_response(request, "time:countdown-timer", data, lambda: service.countdown_timer(data).model_dump())

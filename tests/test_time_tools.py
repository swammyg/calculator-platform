"""Unit coverage for the deterministic time-tool calculation layer."""
from datetime import date, datetime

import pytest
import pytz
from pydantic import ValidationError

from app.models.time_tools import AgeCalculatorRequest, CountdownTimerRequest, TimezoneConverterRequest
from app.services.time_tools_service import age_calculator, countdown_timer, timezone_converter


def test_timezone_converter_returns_conversion_and_200_zones() -> None:
    result = timezone_converter(TimezoneConverterRequest(source_timezone="America/New_York", target_timezone="Europe/London", date_time="2026-01-15T12:00:00-05:00"))
    assert result.source_time.startswith("2026-01-15 12:00:00 EST")
    assert result.target_time.startswith("2026-01-15 17:00:00 GMT")
    assert result.time_difference_hours == 5.0
    assert len(result.list_of_200_timezones) == 200


def test_invalid_timezone_is_rejected_by_the_request_model() -> None:
    with pytest.raises(ValidationError, match="valid IANA timezone"):
        TimezoneConverterRequest(source_timezone="Not/A_Zone", target_timezone="UTC", date_time="2026-01-01T00:00:00Z")


def test_age_calculator_handles_leap_day_birthdays() -> None:
    result = age_calculator(AgeCalculatorRequest(birthdate=date(2000, 2, 29)), now=pytz.UTC.localize(datetime(2025, 3, 1, 12)))
    assert (result.age_years, result.age_months, result.age_days) == (25, 0, 1)
    assert result.zodiac_sign == "Pisces"
    assert result.next_birthday_days == 364
    assert result.total_days_lived > 9_000


def test_age_calculator_rejects_future_birthdate() -> None:
    with pytest.raises(ValueError, match="future"):
        age_calculator(AgeCalculatorRequest(birthdate=date(2030, 1, 1)), now=pytz.UTC.localize(datetime(2026, 1, 1)))


def test_countdown_is_human_readable_and_calculates_progress() -> None:
    now = pytz.UTC.localize(datetime(2026, 1, 1, 0, 0, 0))
    result = countdown_timer(CountdownTimerRequest(target_date="2026-01-03T01:02:03Z", start_date="2026-01-01T00:00:00Z", event_name="Launch", timezone="Europe/London"), now=now)
    assert (result.days_remaining, result.hours_remaining, result.minutes_remaining, result.seconds_remaining) == (2, 1, 2, 3)
    assert result.percentage_complete == 0.0
    assert result.human_readable.endswith("until Launch")


def test_countdown_rejects_past_target() -> None:
    with pytest.raises(ValueError, match="future"):
        countdown_timer(CountdownTimerRequest(target_date="2025-12-31T23:59:59Z", timezone="UTC"), now=pytz.UTC.localize(datetime(2026, 1, 1)))

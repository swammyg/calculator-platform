"""Timezone-aware implementations for the time utility endpoints."""
from datetime import date, datetime, time, timedelta

import pytz

from app.models.time_tools import (
    AgeCalculatorRequest, AgeCalculatorResult, CountdownTimerRequest,
    CountdownTimerResult, TimezoneConverterRequest, TimezoneConverterResult,
    TimezoneEntry,
)


def _to_utc(value: datetime, assumed_timezone: str | None = None) -> datetime:
    """Return an aware UTC datetime, localising naive values when requested."""
    if value.tzinfo is None:
        if assumed_timezone is None:
            raise ValueError("date_time must include an ISO 8601 UTC offset")
        try:
            value = pytz.timezone(assumed_timezone).localize(value, is_dst=None)
        except pytz.AmbiguousTimeError as exc:
            raise ValueError("date_time is ambiguous during a daylight-saving transition; include an offset") from exc
        except pytz.NonExistentTimeError as exc:
            raise ValueError("date_time does not exist during a daylight-saving transition") from exc
    return value.astimezone(pytz.UTC)


def timezone_converter(data: TimezoneConverterRequest) -> TimezoneConverterResult:
    """Convert an ISO 8601 instant and return 200 IANA zones with current times."""
    source_zone, target_zone = pytz.timezone(data.source_timezone), pytz.timezone(data.target_timezone)
    instant = _to_utc(data.date_time, data.source_timezone)
    source_time, target_time = instant.astimezone(source_zone), instant.astimezone(target_zone)
    difference = (target_time.utcoffset() - source_time.utcoffset()).total_seconds() / 3600  # type: ignore[union-attr]
    now = datetime.now(pytz.UTC)
    zones = [TimezoneEntry(timezone=zone, current_time=now.astimezone(pytz.timezone(zone)).strftime("%Y-%m-%d %H:%M:%S %Z%z")) for zone in sorted(pytz.all_timezones)[:200]]
    return TimezoneConverterResult(source_time=source_time.strftime("%Y-%m-%d %H:%M:%S %Z%z"), target_time=target_time.strftime("%Y-%m-%d %H:%M:%S %Z%z"), time_difference_hours=round(difference, 2), list_of_200_timezones=zones)


def _anniversary(birthdate: date, year: int) -> date:
    """Return the birthday in year; leap-day birthdays use 28 February in non-leap years."""
    try:
        return birthdate.replace(year=year)
    except ValueError:
        return date(year, 2, 28)


def _zodiac_sign(value: date) -> str:
    """Map a birth date to the western tropical zodiac."""
    signs = ((1, 20, "Aquarius"), (2, 19, "Pisces"), (3, 21, "Aries"), (4, 20, "Taurus"), (5, 21, "Gemini"), (6, 21, "Cancer"), (7, 23, "Leo"), (8, 23, "Virgo"), (9, 23, "Libra"), (10, 23, "Scorpio"), (11, 22, "Sagittarius"), (12, 22, "Capricorn"))
    for month, day, sign in signs:
        if (value.month, value.day) < (month, day):
            previous = signs[signs.index((month, day, sign)) - 1]
            return previous[2]
    return "Capricorn"


def age_calculator(data: AgeCalculatorRequest, now: datetime | None = None) -> AgeCalculatorResult:
    """Calculate calendar age and elapsed hours from the supplied birth date."""
    current = now or datetime.now(pytz.UTC)
    current_date = current.date()
    if data.birthdate > current_date:
        raise ValueError("birthdate cannot be in the future")
    years = current_date.year - data.birthdate.year
    anniversary = _anniversary(data.birthdate, current_date.year)
    if current_date < anniversary:
        years -= 1
    last_birthday = _anniversary(data.birthdate, data.birthdate.year + years)
    months = (current_date.year - last_birthday.year) * 12 + current_date.month - last_birthday.month
    if current_date.day < last_birthday.day:
        months -= 1
    month_anchor_year = last_birthday.year + (last_birthday.month - 1 + months) // 12
    month_anchor_month = (last_birthday.month - 1 + months) % 12 + 1
    month_anchor = date(month_anchor_year, month_anchor_month, min(data.birthdate.day, _days_in_month(month_anchor_year, month_anchor_month)))
    total_days = (current_date - data.birthdate).days
    birth_instant = pytz.UTC.localize(datetime.combine(data.birthdate, time.min))
    hours_lived = int((current.astimezone(pytz.UTC) - birth_instant).total_seconds() // 3600)
    next_birthday = _anniversary(data.birthdate, current_date.year)
    if next_birthday < current_date:
        next_birthday = _anniversary(data.birthdate, current_date.year + 1)
    return AgeCalculatorResult(age_years=years, age_months=months, age_days=(current_date - month_anchor).days, hours_lived=hours_lived, total_days_lived=total_days, zodiac_sign=_zodiac_sign(data.birthdate), next_birthday_days=(next_birthday - current_date).days)


def _days_in_month(year: int, month: int) -> int:
    """Return calendar days in a Gregorian month."""
    return ((date(year + (month == 12), month % 12 + 1, 1) - timedelta(days=1)).day)


def countdown_timer(data: CountdownTimerRequest, now: datetime | None = None) -> CountdownTimerResult:
    """Return a future countdown; past targets are rejected rather than silently clamped."""
    zone = pytz.timezone(data.timezone)
    target = _to_utc(data.target_date, data.timezone)
    current = (now or datetime.now(pytz.UTC)).astimezone(pytz.UTC)
    if target <= current:
        raise ValueError("target_date must be in the future")
    remaining = int((target - current).total_seconds())
    days, remainder = divmod(remaining, 86_400)
    hours, remainder = divmod(remainder, 3_600)
    minutes, seconds = divmod(remainder, 60)
    if data.start_date:
        start = _to_utc(data.start_date, data.timezone)
        percentage = min(100.0, max(0.0, (current - start).total_seconds() / (target - start).total_seconds() * 100))
    else:
        percentage = 0.0
    pieces = [f"{days} day{'s' if days != 1 else ''}", f"{hours} hour{'s' if hours != 1 else ''}", f"{minutes} minute{'s' if minutes != 1 else ''}", f"{seconds} second{'s' if seconds != 1 else ''}"]
    name = f" until {data.event_name}" if data.event_name else ""
    return CountdownTimerResult(event_name=data.event_name, target_date=target.astimezone(zone).strftime("%Y-%m-%d %H:%M:%S %Z%z"), days_remaining=days, hours_remaining=hours, minutes_remaining=minutes, seconds_remaining=seconds, percentage_complete=round(percentage, 2), human_readable=f"{', '.join(pieces)} remaining{name}")

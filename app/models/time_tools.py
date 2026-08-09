"""Pydantic contracts for timezone, age, and countdown tools."""
from datetime import date, datetime
from typing import Literal

import pytz
from pydantic import BaseModel, Field, field_validator, model_validator


def _validate_timezone(value: str) -> str:
    """Validate an IANA timezone using pytz and return its canonical input."""
    try:
        pytz.timezone(value)
    except pytz.UnknownTimeZoneError as exc:
        raise ValueError("timezone must be a valid IANA timezone, for example 'Europe/London'") from exc
    return value


class TimezoneConverterRequest(BaseModel):
    """Example: ``{"source_timezone":"America/New_York","target_timezone":"Europe/London","date_time":"2026-08-07T14:30:00-04:00"}``."""
    source_timezone: str = Field(min_length=1, max_length=100)
    target_timezone: str = Field(min_length=1, max_length=100)
    date_time: datetime = Field(description="ISO 8601 date-time. An offset is recommended to avoid DST ambiguity.")

    @field_validator("source_timezone", "target_timezone")
    @classmethod
    def valid_timezone(cls, value: str) -> str:
        return _validate_timezone(value)


class TimezoneEntry(BaseModel):
    timezone: str
    current_time: str


class TimezoneConverterResult(BaseModel):
    source_time: str
    target_time: str
    time_difference_hours: float
    list_of_200_timezones: list[TimezoneEntry]


class AgeCalculatorRequest(BaseModel):
    """Example: ``{"birthdate":"1990-05-15"}``."""
    birthdate: date


class AgeCalculatorResult(BaseModel):
    age_years: int
    age_months: int
    age_days: int
    hours_lived: int
    total_days_lived: int
    zodiac_sign: str
    next_birthday_days: int


class CountdownTimerRequest(BaseModel):
    """Example: ``{"target_date":"2027-01-01T00:00:00Z","event_name":"New Year","timezone":"Europe/London"}``."""
    target_date: datetime
    event_name: str | None = Field(default=None, max_length=200)
    timezone: str = "UTC"
    start_date: datetime | None = Field(default=None, description="Optional ISO 8601 start used to calculate percentage_complete.")

    @field_validator("timezone")
    @classmethod
    def valid_timezone(cls, value: str) -> str:
        return _validate_timezone(value)

    @model_validator(mode="after")
    def valid_date_range(self) -> "CountdownTimerRequest":
        if self.start_date and self.start_date >= self.target_date:
            raise ValueError("start_date must be earlier than target_date")
        return self


class CountdownTimerResult(BaseModel):
    event_name: str | None
    target_date: str
    days_remaining: int
    hours_remaining: int
    minutes_remaining: int
    seconds_remaining: int
    percentage_complete: float
    human_readable: str

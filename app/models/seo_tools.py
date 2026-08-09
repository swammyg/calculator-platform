"""Validated request and result models for SEO content analysis."""
import re

from pydantic import BaseModel, Field, field_validator

WORD_PATTERN = re.compile(r"[\w]+(?:['’-][\w]+)?", re.UNICODE)


class SEOTextRequest(BaseModel):
    """Text analysis input; example: ``{"text": "Ten or more words are required for a useful SEO analysis result."}``."""
    text: str = Field(min_length=1, max_length=100_000)

    @field_validator("text")
    @classmethod
    def text_has_at_least_ten_words(cls, value: str) -> str:
        if len(WORD_PATTERN.findall(value)) < 10:
            raise ValueError("text must contain at least 10 words")
        return value


class WordCounterResult(BaseModel):
    word_count: int
    char_count: int
    char_count_no_spaces: int
    sentence_count: int
    paragraph_count: int
    reading_time_minutes: float
    unique_words: int
    frequency_map: dict[str, int]


class ReadabilityScoreResult(BaseModel):
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    gunning_fog: float
    coleman_liau: float
    smog_grade: float
    uk_grade_level: str
    recommendations: list[str]


class KeywordDensityRequest(SEOTextRequest):
    """Example: ``{"text": "...at least ten words...", "focus_keyword": "content marketing"}``."""
    focus_keyword: str | None = Field(default=None, max_length=200)

    @field_validator("focus_keyword")
    @classmethod
    def focus_keyword_not_blank(cls, value: str | None) -> str | None:
        if value is not None and not WORD_PATTERN.findall(value):
            raise ValueError("focus_keyword must contain at least one word when supplied")
        return value.strip() if value else None


class KeywordFrequency(BaseModel):
    keyword: str
    count: int


class KeywordDensityResult(BaseModel):
    total_words: int
    keyword_count: int
    keyword_density_percent: float
    top_10_keywords: list[KeywordFrequency]
    recommendations: list[str]

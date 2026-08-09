"""Unit tests for SEO content analysis endpoints' service layer."""
import pytest
from pydantic import ValidationError

from app.models.seo_tools import KeywordDensityRequest, SEOTextRequest
from app.services.seo_tools_service import keyword_density, readability_score, word_counter

TEXT = "Content marketing helps small businesses create useful content for customers. Useful content builds trust and improves search visibility."


def test_word_counter_returns_complete_statistics() -> None:
    result = word_counter(SEOTextRequest(text=TEXT))
    assert result.word_count == 18
    assert result.sentence_count == 2
    assert result.paragraph_count == 1
    assert result.char_count_no_spaces < result.char_count
    assert result.frequency_map["content"] == 3


def test_readability_returns_all_requested_metrics_and_guidance() -> None:
    result = readability_score(SEOTextRequest(text=TEXT))
    assert isinstance(result.flesch_reading_ease, float)
    assert isinstance(result.flesch_kincaid_grade, float)
    assert isinstance(result.gunning_fog, float)
    assert result.uk_grade_level
    assert result.recommendations


def test_keyword_density_uses_stemming_for_focus_keyword() -> None:
    result = keyword_density(KeywordDensityRequest(text="Running run every morning. The athlete enjoys running with friends every weekend.", focus_keyword="run"))
    assert result.total_words == 12
    assert result.keyword_count == 3
    assert result.keyword_density_percent == round(3 / 12 * 100, 2)
    assert result.top_10_keywords


def test_keyword_density_without_focus_keyword_returns_guidance() -> None:
    result = keyword_density(KeywordDensityRequest(text=TEXT))
    assert result.keyword_count == 0
    assert "focus_keyword" in result.recommendations[0]


def test_short_text_is_rejected() -> None:
    with pytest.raises(ValidationError, match="at least 10 words"):
        SEOTextRequest(text="Only eight words are provided in this short input")

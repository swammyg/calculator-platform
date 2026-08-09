"""SEO analysis logic using textstat and NLTK linguistic primitives."""
import re
from collections import Counter
from functools import lru_cache
from math import sqrt

import nltk
import textstat
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer

from app.models.seo_tools import (
    KeywordDensityRequest, KeywordDensityResult, KeywordFrequency,
    ReadabilityScoreResult, SEOTextRequest, WordCounterResult,
)

WORD_PATTERN = re.compile(r"[\w]+(?:['’-][\w]+)?", re.UNICODE)
SENTENCE_PATTERN = re.compile(r"[^.!?]+[.!?]+|[^.!?]+$", re.UNICODE)
PARAGRAPH_PATTERN = re.compile(r"\n\s*\n", re.UNICODE)
FALLBACK_STOP_WORDS = frozenset({"a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he", "in", "is", "it", "its", "of", "on", "or", "that", "the", "to", "was", "were", "will", "with", "you", "your"})
STEMMER = SnowballStemmer("english")


def _words(text: str) -> list[str]:
    """Return lower-cased word tokens without requiring NLTK Punkt data."""
    return [word.lower() for word in WORD_PATTERN.findall(text)]


@lru_cache(maxsize=1)
def _stop_words() -> frozenset[str]:
    """Load NLTK's English stop-word corpus with a resilient deployment fallback.

    Production images should bundle ``corpora/stopwords`` in ``NLTK_DATA``. The
    compact fallback prevents a missing corpus from turning user content into a
    500 response while retaining the NLTK stemmer in all environments.
    """
    try:
        return frozenset(stopwords.words("english"))
    except LookupError:
        return FALLBACK_STOP_WORDS


def _content_terms(text: str) -> tuple[list[str], dict[str, str]]:
    """Filter stop words and group original word forms by NLTK stem."""
    representatives: dict[str, str] = {}
    stems: list[str] = []
    ignored = _stop_words()
    for word in _words(text):
        if len(word) < 3 or word in ignored or word.isnumeric():
            continue
        stem = STEMMER.stem(word)
        representatives.setdefault(stem, word)
        stems.append(stem)
    return stems, representatives


def word_counter(data: SEOTextRequest) -> WordCounterResult:
    """Count text characteristics and return a case-insensitive word frequency map."""
    words = _words(data.text)
    sentences = [segment for segment in SENTENCE_PATTERN.findall(data.text) if segment.strip()]
    paragraphs = [segment for segment in PARAGRAPH_PATTERN.split(data.text.strip()) if segment.strip()]
    counts = Counter(words)
    return WordCounterResult(word_count=len(words), char_count=len(data.text), char_count_no_spaces=len(re.sub(r"\s", "", data.text)), sentence_count=len(sentences), paragraph_count=len(paragraphs), reading_time_minutes=round(len(words) / 200, 2), unique_words=len(counts), frequency_map=dict(sorted(counts.items())))


def _uk_grade_level(grade: float) -> str:
    """Translate an approximate US readability grade to a UK school stage."""
    if grade <= 6:
        return "Primary school (Key Stage 2)"
    if grade <= 9:
        return f"Year {min(10, max(7, round(grade) + 1))} (Key Stage 3)"
    if grade <= 11:
        return "Years 10–11 (GCSE / Key Stage 4)"
    if grade <= 13:
        return "Years 12–13 (A-level / Key Stage 5)"
    return "Higher education / professional audience"


def _readability_recommendations(flesch: float, grade: float, fog: float, words: int) -> list[str]:
    """Create actionable content guidance from established readability measures."""
    recommendations: list[str] = []
    if flesch < 60:
        recommendations.append("Use shorter sentences and familiar words to improve reading ease.")
    if grade > 9 or fog > 12:
        recommendations.append("Replace complex terms where possible and explain necessary technical language.")
    if words < 300:
        recommendations.append("Consider expanding the content with helpful detail, examples, or FAQs for stronger topical coverage.")
    if not recommendations:
        recommendations.append("Readability is well suited to a broad online audience; keep headings and paragraphs scannable.")
    return recommendations


def _heuristic_syllables(word: str) -> int:
    """Estimate syllables for resilient scoring when optional CMU data is absent."""
    groups = re.findall(r"[aeiouy]+", word.lower())
    return max(1, len(groups) - int(word.lower().endswith("e") and len(groups) > 1))


@lru_cache(maxsize=1)
def _cmudict_is_available() -> bool:
    """Avoid textstat triggering an unexpected NLTK corpus download at request time."""
    try:
        nltk.data.find("corpora/cmudict")
        return True
    except LookupError:
        return False


def _fallback_readability(text: str) -> tuple[float, float, float, float, float]:
    """Calculate standard formulas if textstat's optional CMU corpus is not deployed."""
    words = _words(text)
    count = len(words)
    sentences = max(1, len([segment for segment in SENTENCE_PATTERN.findall(text) if segment.strip()]))
    syllables = sum(_heuristic_syllables(word) for word in words)
    complex_words = sum(_heuristic_syllables(word) >= 3 for word in words)
    letters = sum(len(re.sub(r"[^a-zA-Z]", "", word)) for word in words)
    flesch = 206.835 - 1.015 * count / sentences - 84.6 * syllables / count
    grade = .39 * count / sentences + 11.8 * syllables / count - 15.59
    fog = .4 * (count / sentences + 100 * complex_words / count)
    coleman = .0588 * (letters / count * 100) - .296 * (sentences / count * 100) - 15.8
    smog = 1.043 * sqrt(complex_words * 30 / sentences) + 3.1291
    return flesch, grade, fog, coleman, smog


def readability_score(data: SEOTextRequest) -> ReadabilityScoreResult:
    """Calculate six textstat readability measures and UK-focused content guidance."""
    if _cmudict_is_available():
        try:
            flesch = float(textstat.flesch_reading_ease(data.text))
            grade = float(textstat.flesch_kincaid_grade(data.text))
            fog = float(textstat.gunning_fog(data.text))
            coleman = float(textstat.coleman_liau_index(data.text))
            smog = float(textstat.smog_index(data.text))
        except Exception:
            flesch, grade, fog, coleman, smog = _fallback_readability(data.text)
    else:
        flesch, grade, fog, coleman, smog = _fallback_readability(data.text)
    return ReadabilityScoreResult(flesch_reading_ease=round(flesch, 2), flesch_kincaid_grade=round(grade, 2), gunning_fog=round(fog, 2), coleman_liau=round(coleman, 2), smog_grade=round(smog, 2), uk_grade_level=_uk_grade_level(grade), recommendations=_readability_recommendations(flesch, grade, fog, len(_words(data.text))))


def _count_phrase(stems: list[str], phrase_stems: list[str]) -> int:
    """Count non-overlapping consecutive occurrences of a stemmed keyword phrase."""
    if not phrase_stems:
        return 0
    return sum(stems[index:index + len(phrase_stems)] == phrase_stems for index in range(len(stems) - len(phrase_stems) + 1))


def keyword_density(data: KeywordDensityRequest) -> KeywordDensityResult:
    """Calculate stemmed keyword density and top ten non-stop-word keyword stems."""
    all_words = _words(data.text)
    terms, representatives = _content_terms(data.text)
    frequencies = Counter(terms)
    top = [KeywordFrequency(keyword=representatives[stem], count=count) for stem, count in sorted(frequencies.items(), key=lambda item: (-item[1], representatives[item[0]]))[:10]]
    if data.focus_keyword:
        phrase_stems, _ = _content_terms(data.focus_keyword)
        keyword_count = _count_phrase([STEMMER.stem(word) for word in all_words], phrase_stems)
        density = keyword_count / len(all_words) * 100
        recommendations = []
        if keyword_count == 0:
            recommendations.append("Add the focus keyword naturally to the title, introduction, and relevant headings.")
        elif density < 0.5:
            recommendations.append("Use the focus keyword naturally in a few more relevant places; avoid forced repetition.")
        elif density > 3:
            recommendations.append("Reduce repeated focus-keyword usage to avoid keyword stuffing.")
        else:
            recommendations.append("Focus-keyword density is within a natural 0.5–3% range.")
    else:
        keyword_count, density = 0, 0.0
        recommendations = ["Set a focus_keyword to receive a density analysis and optimisation guidance."]
    if not terms:
        recommendations.append("Add more descriptive, non-stop-word content to create meaningful keyword signals.")
    return KeywordDensityResult(total_words=len(all_words), keyword_count=keyword_count, keyword_density_percent=round(density, 2), top_10_keywords=top, recommendations=recommendations)

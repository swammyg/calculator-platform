"""Cached HTTP routes for the SEO analysis tools."""
from typing import Any

from fastapi import APIRouter, Request

from app.models.seo_tools import KeywordDensityRequest, SEOTextRequest
from app.routes.common import cached_response
from app.services import seo_tools_service as service

router = APIRouter(prefix="/api/v1/tools/seo", tags=["SEO tools"])


@router.post("/word-counter", summary="Count words, characters, and term frequency")
async def word_counter(data: SEOTextRequest, request: Request) -> dict[str, Any]:
    """Return text counts and a one-hour-cached case-insensitive frequency map."""
    return await cached_response(request, "seo:word-counter", data, lambda: service.word_counter(data).model_dump())


@router.post("/readability-score", summary="Calculate textstat readability scores")
async def readability_score(data: SEOTextRequest, request: Request) -> dict[str, Any]:
    """Return six readability scores, a UK level, and actionable recommendations."""
    return await cached_response(request, "seo:readability-score", data, lambda: service.readability_score(data).model_dump())


@router.post("/keyword-density", summary="Analyse stemmed keyword frequency and density")
async def keyword_density(data: KeywordDensityRequest, request: Request) -> dict[str, Any]:
    """Filter stop words with NLTK and return stemmed top-keyword information."""
    return await cached_response(request, "seo:keyword-density", data, lambda: service.keyword_density(data).model_dump())

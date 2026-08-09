"""Response-time regression checks for all public calculator and tool routes."""
from time import perf_counter

import pytest
from fastapi.testclient import TestClient

from tests.test_api_endpoints import CALCULATORS, SEO_TEXT, SEO_TOOLS, TIME_TOOLS


@pytest.mark.parametrize(
    ("prefix", "path", "body"),
    [("/api/v1/calculators", path, body) for path, body, _ in CALCULATORS]
    + [("/api/v1/tools/time", path, body) for path, body, _ in TIME_TOOLS]
    + [("/api/v1/tools/seo", path, body) for path, body, _ in SEO_TOOLS],
)
def test_endpoint_responds_within_500ms(client: TestClient, prefix: str, path: str, body: dict[str, object]) -> None:
    """Keep deterministic calculation work below the 500ms per-request budget."""
    started = perf_counter()
    response = client.post(f"{prefix}{path}", json=body)
    elapsed_ms = (perf_counter() - started) * 1_000
    assert response.status_code == 200, response.text
    assert elapsed_ms < 500, f"{prefix}{path} took {elapsed_ms:.1f}ms"


def test_cached_repeat_request_is_faster_than_budget(client: TestClient) -> None:
    """A repeated SEO request is served from the one-hour cache and marked cached."""
    payload = {"text": SEO_TEXT}
    client.post("/api/v1/tools/seo/word-counter", json=payload)
    started = perf_counter()
    response = client.post("/api/v1/tools/seo/word-counter", json=payload)
    assert response.status_code == 200
    assert response.json()["cached"] is True
    assert (perf_counter() - started) * 1_000 < 500

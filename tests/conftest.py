"""Shared HTTP client and helpers for API endpoint tests."""
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """Run each API test through FastAPI's lifespan and middleware stack."""
    with TestClient(app) as test_client:
        yield test_client


def assert_success_envelope(payload: dict[str, object]) -> None:
    """Assert the response contract shared by all successful tool routes."""
    assert set(payload) == {"result", "metadata", "cached"}
    assert isinstance(payload["result"], dict)
    metadata = payload["metadata"]
    assert isinstance(metadata, dict)
    assert {"timestamp", "id", "disclaimer"} <= set(metadata)
    assert isinstance(payload["cached"], bool)


def assert_validation_envelope(payload: dict[str, object]) -> None:
    """Assert the API's consistent validation-error response contract."""
    assert payload["cached"] is False
    assert "error" in payload and "metadata" in payload

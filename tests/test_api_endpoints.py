"""Comprehensive HTTP-level tests for all 17 public calculator and tool routes."""
import pytest
from fastapi.testclient import TestClient

from app.models.seo_tools import SEOTextRequest
from app.services import seo_tools_service
from tests.conftest import assert_success_envelope, assert_validation_envelope


CALCULATORS: list[tuple[str, dict[str, object], set[str]]] = [
    ("/uk-salary-tax", {"annual_salary_gbp": 50_000, "bonus_gbp": 0, "pension_contribution_pct": 0, "is_scotland": False, "student_loan": False}, {"annual_take_home", "income_tax", "monthly_take_home"}),
    ("/uk-mortgage", {"property_price_gbp": 350_000, "deposit_gbp": 70_000, "interest_rate_percent": 4.5, "term_years": 25, "property_tax_annual_gbp": 1_800, "insurance_annual_gbp": 300}, {"loan_amount", "stamp_duty_land_tax", "monthly_mortgage_payment"}),
    ("/uk-pension", {"current_age": 35, "retirement_age": 67, "current_salary_gbp": 55_000, "current_pension_pot_gbp": 40_000, "annual_contribution_gbp": 4_000, "employer_contribution_pct": 5}, {"projected_pension_pot_at_retirement", "monthly_pension_income"}),
    ("/uk-personal-finance", {"monthly_income_gbp": 4_000, "essential_expenses_gbp": 1_800, "discretionary_spending_gbp": 600, "savings_goal_gbp": 30_000}, {"monthly_remaining", "years_to_reach_goal", "breakdown"}),
    ("/b2b-roi", {"project_investment_gbp": 10_000, "annual_revenue_increase_gbp": 9_000, "cost_savings_annual_gbp": 3_000, "payback_period_months": 12}, {"annual_benefit", "net_present_value_5yr", "months_to_breakeven"}),
    ("/uk-healthcare-cost", {"procedure_type": "cataract_surgery_private", "private_insurance": False, "recovery_weeks": 4, "time_off_work_weeks": 2, "weekly_income_gbp": 800, "referral_needed": True}, {"procedure_cost_private", "total_private_cost", "total_nhs_cost"}),
    ("/bmi", {"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male"}, {"bmi", "category"}),
    ("/bmr-tdee", {"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male", "activity_level": "moderate"}, {"bmr", "tdee", "formula"}),
    ("/body-fat", {"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male", "neck_cm": 38, "waist_cm": 84}, {"body_fat_percentage", "fat_mass_kg", "lean_mass_kg"}),
    ("/loan", {"principal_usd": 10_000, "annual_rate_percent": 5, "term_months": 36}, {"monthly_payment", "total_interest", "total_paid"}),
    ("/currency-converter", {"amount": 100, "from_currency": "GBP", "to_currency": "USD"}, {"converted_amount", "exchange_rate", "timestamp"}),
]


@pytest.mark.parametrize(("path", "body", "keys"), CALCULATORS, ids=[item[0][1:] for item in CALCULATORS])
def test_all_calculator_endpoints_happy_path(client: TestClient, path: str, body: dict[str, object], keys: set[str]) -> None:
    """Each named calculator accepts a valid payload and returns its key outputs."""
    response = client.post(f"/api/v1/calculators{path}", json=body)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert_success_envelope(payload)
    assert keys <= set(payload["result"])


def test_salary_known_50k_example_and_cached_response(client: TestClient) -> None:
    """Verify a known 2024/25 England/Wales/NI estimate and one-hour cache behavior."""
    body = {"annual_salary_gbp": 50_000, "pension_contribution_pct": 0, "is_scotland": False, "student_loan": False}
    first = client.post("/api/v1/calculators/uk-salary-tax", json=body)
    second = client.post("/api/v1/calculators/uk-salary-tax", json=body)
    assert first.status_code == second.status_code == 200
    result = first.json()["result"]
    assert result["income_tax"] == 7_486
    assert result["annual_take_home"] == 38_514
    assert second.json()["cached"] is True


@pytest.mark.parametrize(("path", "body"), [
    ("/uk-salary-tax", {"annual_salary_gbp": -1}),
    ("/uk-mortgage", {"property_price_gbp": 100_000, "deposit_gbp": 100_001, "interest_rate_percent": 4, "term_years": 25, "property_tax_annual_gbp": 0, "insurance_annual_gbp": 0}),
    ("/uk-pension", {"current_age": 50, "retirement_age": 50, "current_salary_gbp": 0, "current_pension_pot_gbp": 0, "annual_contribution_gbp": 0, "employer_contribution_pct": 0}),
    ("/uk-personal-finance", {"monthly_income_gbp": -1, "essential_expenses_gbp": 0, "discretionary_spending_gbp": 0, "savings_goal_gbp": 0}),
    ("/b2b-roi", {"project_investment_gbp": 0, "annual_revenue_increase_gbp": 0, "cost_savings_annual_gbp": 0, "payback_period_months": 12}),
    ("/uk-healthcare-cost", {"procedure_type": "not-a-procedure", "recovery_weeks": 0, "time_off_work_weeks": 0, "weekly_income_gbp": 0}),
    ("/bmi", {"weight_kg": -1, "height_cm": 175, "age": 30, "gender": "male"}),
    ("/bmr-tdee", {"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "other", "activity_level": "moderate"}),
    ("/body-fat", {"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male", "neck_cm": 40, "waist_cm": 40}),
    ("/loan", {"principal_usd": 1_000, "annual_rate_percent": -1, "term_months": 12}),
    ("/currency-converter", {"amount": 10, "from_currency": "DOGE", "to_currency": "GBP"}),
], ids=[item[0][1:] for item in CALCULATORS])
def test_all_calculators_reject_invalid_inputs(client: TestClient, path: str, body: dict[str, object]) -> None:
    """Every calculator reports bad values with a structured 422 response."""
    response = client.post(f"/api/v1/calculators{path}", json=body)
    assert response.status_code == 422
    assert_validation_envelope(response.json())


def test_calculator_boundary_and_zero_rate_cases(client: TestClient) -> None:
    """Exercise supported zero values, maximum input, and no-interest amortisation."""
    zero_loan = client.post("/api/v1/calculators/loan", json={"principal_usd": 1_000, "annual_rate_percent": 0, "term_months": 10})
    large_currency = client.post("/api/v1/calculators/currency-converter", json={"amount": 1_000_000_000, "from_currency": "GBP", "to_currency": "GBP"})
    zero_goal = client.post("/api/v1/calculators/uk-personal-finance", json={"monthly_income_gbp": 0, "essential_expenses_gbp": 0, "discretionary_spending_gbp": 0, "savings_goal_gbp": 0})
    assert zero_loan.json()["result"]["monthly_payment"] == 100
    assert large_currency.json()["result"]["converted_amount"] == 1_000_000_000
    assert zero_goal.json()["result"]["years_to_reach_goal"] == 0


TIME_TOOLS: list[tuple[str, dict[str, object], set[str]]] = [
    ("/timezone-converter", {"source_timezone": "America/New_York", "target_timezone": "Europe/London", "date_time": "2026-01-15T12:00:00-05:00"}, {"source_time", "target_time", "time_difference_hours", "list_of_200_timezones"}),
    ("/age-calculator", {"birthdate": "1990-05-15"}, {"age_years", "age_months", "age_days", "hours_lived", "zodiac_sign"}),
    ("/countdown-timer", {"target_date": "2030-01-01T00:00:00Z", "event_name": "New Year", "timezone": "Europe/London", "start_date": "2025-01-01T00:00:00Z"}, {"days_remaining", "hours_remaining", "percentage_complete", "human_readable"}),
]


@pytest.mark.parametrize(("path", "body", "keys"), TIME_TOOLS, ids=[item[0][1:] for item in TIME_TOOLS])
def test_all_time_endpoints_happy_path(client: TestClient, path: str, body: dict[str, object], keys: set[str]) -> None:
    response = client.post(f"/api/v1/tools/time{path}", json=body)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert_success_envelope(payload)
    assert keys <= set(payload["result"])


def test_timezone_converter_handles_major_zone_dst_difference(client: TestClient) -> None:
    """London is five hours ahead of New York during July daylight-saving time."""
    response = client.post("/api/v1/tools/time/timezone-converter", json={"source_timezone": "America/New_York", "target_timezone": "Europe/London", "date_time": "2026-07-01T12:00:00-04:00"})
    assert response.status_code == 200
    result = response.json()["result"]
    assert result["time_difference_hours"] == 5.0
    assert len(result["list_of_200_timezones"]) == 200


@pytest.mark.parametrize(("path", "body"), [
    ("/timezone-converter", {"source_timezone": "Invalid/Zone", "target_timezone": "UTC", "date_time": "2026-01-01T00:00:00Z"}),
    ("/age-calculator", {"birthdate": "2999-01-01"}),
    ("/countdown-timer", {"target_date": "2020-01-01T00:00:00Z", "timezone": "UTC"}),
], ids=["invalid-timezone", "future-birthdate", "past-countdown"])
def test_time_tools_report_validation_or_domain_errors(client: TestClient, path: str, body: dict[str, object]) -> None:
    response = client.post(f"/api/v1/tools/time{path}", json=body)
    assert response.status_code == 422
    assert_validation_envelope(response.json())


SEO_TEXT = "Content marketing helps small businesses create useful content for customers. Useful content builds trust and improves search visibility."


SEO_TOOLS: list[tuple[str, dict[str, object], set[str]]] = [
    ("/word-counter", {"text": SEO_TEXT}, {"word_count", "frequency_map", "reading_time_minutes"}),
    ("/readability-score", {"text": SEO_TEXT}, {"flesch_reading_ease", "smog_grade", "uk_grade_level", "recommendations"}),
    ("/keyword-density", {"text": SEO_TEXT, "focus_keyword": "content"}, {"total_words", "keyword_count", "top_10_keywords", "recommendations"}),
]


@pytest.mark.parametrize(("path", "body", "keys"), SEO_TOOLS, ids=[item[0][1:] for item in SEO_TOOLS])
def test_all_seo_endpoints_happy_path(client: TestClient, path: str, body: dict[str, object], keys: set[str]) -> None:
    response = client.post(f"/api/v1/tools/seo{path}", json=body)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert_success_envelope(payload)
    assert keys <= set(payload["result"])


@pytest.mark.parametrize("path", ["/word-counter", "/readability-score", "/keyword-density"])
def test_seo_tools_reject_empty_and_underlength_text(client: TestClient, path: str) -> None:
    for text in ("", "one two three four five six seven eight nine"):
        response = client.post(f"/api/v1/tools/seo{path}", json={"text": text})
        assert response.status_code == 422
        assert_validation_envelope(response.json())


def test_word_counter_handles_long_special_character_content(client: TestClient) -> None:
    """A near-limit input remains analysable and retains Unicode word frequency."""
    text = ("Café naïve co-operate — SEO! " * 3_000).strip()
    response = client.post("/api/v1/tools/seo/word-counter", json={"text": text})
    assert response.status_code == 200
    result = response.json()["result"]
    assert result["word_count"] == 12_000
    assert result["frequency_map"]["café"] == 3_000
    assert result["char_count_no_spaces"] < result["char_count"]


def test_keyword_stemming_and_frequency_are_accurate(client: TestClient) -> None:
    text = "Running run every morning. The athlete enjoys running with friends every weekend. More details improve content quality."
    response = client.post("/api/v1/tools/seo/keyword-density", json={"text": text, "focus_keyword": "run"})
    assert response.status_code == 200
    result = response.json()["result"]
    assert result["keyword_count"] == 3
    assert result["keyword_density_percent"] == round(3 / result["total_words"] * 100, 2)


def test_readability_fallback_matches_reference_formula(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify fallback output against the service's documented standard formulas."""
    monkeypatch.setattr(seo_tools_service, "_cmudict_is_available", lambda: False)
    text = "Simple words make clear sentences. Clear writing helps readers understand useful information quickly."
    result = seo_tools_service.readability_score(SEOTextRequest(text=text))
    words = seo_tools_service._words(text)
    sentences = len(seo_tools_service.SENTENCE_PATTERN.findall(text))
    syllables = sum(seo_tools_service._heuristic_syllables(word) for word in words)
    expected_flesch = round(206.835 - 1.015 * len(words) / sentences - 84.6 * syllables / len(words), 2)
    assert result.flesch_reading_ease == expected_flesch

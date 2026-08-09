"""Production Locust profile for the calculator platform.

The load shape ramps from zero to 100 concurrent users during the first
30 seconds, holds 100 users for the remaining 4 minutes 30 seconds, then
stops. Tasks are weighted 40% calculators, 30% time tools, and 30% SEO tools.

Run with ``locust -f load_tests/locustfile.py --host https://calculator.app
--headless``.  Optional AWS telemetry is enabled by setting ``AWS_REGION``,
``RDS_INSTANCE_ID``, and ``ELASTICACHE_CLUSTER_ID``; credentials must be
available through the standard AWS credential chain.
"""
from __future__ import annotations

import os
import random
from datetime import UTC, datetime, timedelta
from typing import Any

from locust import HttpUser, LoadTestShape, between, events, task


SEO_TEXT = "Content marketing helps small businesses create useful content for customers. Useful content builds trust and improves search visibility."
CALCULATORS: tuple[tuple[str, dict[str, object]], ...] = (
    ("/api/v1/calculators/uk-salary-tax", {"annual_salary_gbp": 50_000, "pension_contribution_pct": 5}),
    ("/api/v1/calculators/uk-mortgage", {"property_price_gbp": 350_000, "deposit_gbp": 70_000, "interest_rate_percent": 4.5, "term_years": 25, "property_tax_annual_gbp": 1_800, "insurance_annual_gbp": 300}),
    ("/api/v1/calculators/uk-pension", {"current_age": 35, "retirement_age": 67, "current_salary_gbp": 55_000, "current_pension_pot_gbp": 40_000, "annual_contribution_gbp": 4_000, "employer_contribution_pct": 5}),
    ("/api/v1/calculators/uk-personal-finance", {"monthly_income_gbp": 4_000, "essential_expenses_gbp": 1_800, "discretionary_spending_gbp": 600, "savings_goal_gbp": 30_000}),
    ("/api/v1/calculators/b2b-roi", {"project_investment_gbp": 10_000, "annual_revenue_increase_gbp": 9_000, "cost_savings_annual_gbp": 3_000, "payback_period_months": 12}),
    ("/api/v1/calculators/uk-healthcare-cost", {"procedure_type": "cataract_surgery_private", "recovery_weeks": 4, "time_off_work_weeks": 2, "weekly_income_gbp": 800}),
    ("/api/v1/calculators/bmi", {"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male"}),
    ("/api/v1/calculators/bmr-tdee", {"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male", "activity_level": "moderate"}),
    ("/api/v1/calculators/body-fat", {"weight_kg": 70, "height_cm": 175, "age": 30, "gender": "male", "neck_cm": 38, "waist_cm": 84}),
    ("/api/v1/calculators/loan", {"principal_usd": 10_000, "annual_rate_percent": 5, "term_months": 36}),
    ("/api/v1/calculators/currency-converter", {"amount": 100, "from_currency": "GBP", "to_currency": "USD"}),
)
TIME_TOOLS: tuple[tuple[str, dict[str, object]], ...] = (
    ("/api/v1/tools/time/timezone-converter", {"source_timezone": "America/New_York", "target_timezone": "Europe/London", "date_time": "2026-08-07T14:30:00-04:00"}),
    ("/api/v1/tools/time/age-calculator", {"birthdate": "1990-05-15"}),
    ("/api/v1/tools/time/countdown-timer", {"target_date": "2030-01-01T00:00:00Z", "event_name": "New Year", "timezone": "Europe/London"}),
)
SEO_TOOLS: tuple[tuple[str, dict[str, object]], ...] = (
    ("/api/v1/tools/seo/word-counter", {"text": SEO_TEXT}),
    ("/api/v1/tools/seo/readability-score", {"text": SEO_TEXT}),
    ("/api/v1/tools/seo/keyword-density", {"text": SEO_TEXT, "focus_keyword": "content"}),
)
CONNECTION_ERROR_MARKERS = ("connection pool", "pool exhausted", "too many connections", "max clients", "connection refused")
connection_errors: list[str] = []


class CalculatorPlatformUser(HttpUser):
    """A user with the required 40/30/30 category traffic distribution."""
    wait_time = between(0.1, 0.4)

    def _post(self, endpoints: tuple[tuple[str, dict[str, object]], ...], category: str) -> None:
        path, payload = random.choice(endpoints)
        endpoint_name = path.rsplit("/", 1)[-1]
        with self.client.post(path, json=payload, name=f"{category}:{endpoint_name}", catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"expected HTTP 200, received {response.status_code}: {response.text[:300]}")
                return
            try:
                body = response.json()
            except ValueError:
                response.failure("response was not valid JSON")
                return
            if not isinstance(body, dict) or "result" not in body or "cached" not in body:
                response.failure("response did not match the API envelope")

    @task(40)
    def calculator(self) -> None:
        self._post(CALCULATORS, "calculator")

    @task(30)
    def time_tool(self) -> None:
        self._post(TIME_TOOLS, "time")

    @task(30)
    def seo_tool(self) -> None:
        self._post(SEO_TOOLS, "seo")


class FiveMinuteRamp(LoadTestShape):
    """Ramp to 100 users over 30 seconds and retain that load for five minutes."""
    ramp_seconds = 30
    total_seconds = 300
    target_users = 100

    def tick(self) -> tuple[int, float] | None:
        elapsed = self.get_run_time()
        if elapsed >= self.total_seconds:
            return None
        if elapsed < self.ramp_seconds:
            users = max(1, round(self.target_users * elapsed / self.ramp_seconds))
            return users, self.target_users / self.ramp_seconds
        return self.target_users, 10


@events.request.add_listener
def record_connection_errors(exception: Exception | None, **_: Any) -> None:
    """Record pool exhaustion signals from HTTP or application failures."""
    if exception is None:
        return
    message = str(exception).lower()
    if any(marker in message for marker in CONNECTION_ERROR_MARKERS):
        connection_errors.append(message)


def _cloudwatch_max(client: Any, namespace: str, metric_name: str, dimensions: list[dict[str, str]]) -> float | None:
    now = datetime.now(UTC)
    response = client.get_metric_statistics(Namespace=namespace, MetricName=metric_name, Dimensions=dimensions, StartTime=now - timedelta(minutes=8), EndTime=now, Period=60, Statistics=["Maximum"])
    points = response.get("Datapoints", [])
    return max((float(point["Maximum"]) for point in points), default=None)


def _report_aws_telemetry() -> list[str]:
    """Return CloudWatch capacity violations when optional AWS identifiers exist."""
    region, rds_id, redis_id = (os.getenv(name) for name in ("AWS_REGION", "RDS_INSTANCE_ID", "ELASTICACHE_CLUSTER_ID"))
    if not all((region, rds_id, redis_id)):
        print("AWS telemetry skipped; set AWS_REGION, RDS_INSTANCE_ID, and ELASTICACHE_CLUSTER_ID to enable it.")
        return []
    try:
        import boto3
        cloudwatch = boto3.client("cloudwatch", region_name=region)
        rds_cpu = _cloudwatch_max(cloudwatch, "AWS/RDS", "CPUUtilization", [{"Name": "DBInstanceIdentifier", "Value": rds_id}])
        rds_connections = _cloudwatch_max(cloudwatch, "AWS/RDS", "DatabaseConnections", [{"Name": "DBInstanceIdentifier", "Value": rds_id}])
        redis_memory = _cloudwatch_max(cloudwatch, "AWS/ElastiCache", "DatabaseMemoryUsagePercentage", [{"Name": "CacheClusterId", "Value": redis_id}])
    except Exception as exc:
        print(f"AWS telemetry unavailable: {exc}")
        return ["could not retrieve AWS telemetry"]
    print(f"AWS telemetry — RDS peak CPU: {rds_cpu if rds_cpu is not None else 'no data'}%, RDS peak connections: {rds_connections if rds_connections is not None else 'no data'}, Redis peak memory: {redis_memory if redis_memory is not None else 'no data'}%")
    failures: list[str] = []
    if rds_cpu is not None and rds_cpu >= 80:
        failures.append(f"RDS CPU reached {rds_cpu:.2f}% (target <80%)")
    max_connections = os.getenv("MAX_DB_CONNECTIONS")
    if max_connections and rds_connections is not None and rds_connections >= float(max_connections):
        failures.append(f"RDS connections reached {rds_connections:.0f} (configured maximum {max_connections})")
    return failures


@events.quitting.add_listener
def enforce_success_criteria(environment: Any, **_: Any) -> None:
    """Fail headless CI runs when latency, errors, pools, or RDS capacity breach targets."""
    total = environment.stats.total
    request_count = total.num_requests
    failure_count = total.num_failures
    error_rate = failure_count / request_count * 100 if request_count else 100.0
    p50 = total.get_response_time_percentile(0.50) or 0
    p95 = total.get_response_time_percentile(0.95) or 0
    p99 = total.get_response_time_percentile(0.99) or 0
    print(f"Load-test summary — requests: {request_count}, RPS: {total.total_rps:.2f}, errors: {error_rate:.2f}%, p50/p95/p99: {p50:.0f}/{p95:.0f}/{p99:.0f}ms")
    failures: list[str] = []
    if request_count == 0:
        failures.append("no requests completed")
    if p95 >= 500:
        failures.append(f"p95 response time was {p95:.0f}ms (target <500ms)")
    if error_rate >= 1:
        failures.append(f"error rate was {error_rate:.2f}% (target <1%)")
    if connection_errors:
        failures.append(f"detected {len(connection_errors)} connection-pool errors")
    failures.extend(_report_aws_telemetry())
    if failures:
        print("LOAD TEST FAILED: " + "; ".join(failures))
        environment.process_exit_code = 1
    else:
        print("LOAD TEST PASSED: all configured success criteria were met.")

# Calculator Tools API

FastAPI backend with 11 calculator endpoints, three time endpoints, and three SEO endpoints. Start it with:

```bash
python -m pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

API documentation is at `/docs`; health is at `/api/v1/health`. Set `APP_REDIS_URL` for shared one-hour Redis caching, and `APP_SENTRY_DSN` to enable Sentry.

Every successful endpoint response has `result`, `metadata`, and `cached`. Requests are limited per client IP (120/minute by default). When Redis is not configured or temporarily unavailable, the service remains available with a bounded in-process cache and limiter; use Redis in multi-instance production deployments.

## Calculator endpoints

All calculator paths are `POST` and begin with `/api/v1/calculators`:

- `/uk-salary-tax` — simplified 2024/25 UK income tax, NI, pension, and Plan 2 loan estimate.
- `/uk-mortgage` — repayment mortgage, ongoing costs, and England/Wales/NI SDLT estimate.
- `/uk-pension` — annual contribution and compound-growth pension projection.
- `/uk-personal-finance` — monthly surplus, savings-goal duration, and 50/30/20 benchmark.
- `/b2b-roi` — annual ROI, break-even, and a five-year NPV.
- `/uk-healthcare-cost` — indicative private versus NHS cost comparison.
- `/bmi`, `/bmr-tdee`, `/body-fat` — adult health estimates; body fat uses U.S. Navy circumference calculations.
- `/loan` — fixed-rate amortising USD loan.
- `/currency-converter` — conversion using bundled indicative FX rates.

For example:

```bash
curl -X POST http://localhost:8000/api/v1/calculators/uk-salary-tax \
  -H 'content-type: application/json' \
  -d '{"annual_salary_gbp":60000,"pension_contribution_pct":5,"student_loan":true}'
```

Currency rates are deliberately bundled for deterministic, cacheable MVP behavior and must be replaced or refreshed from a licensed market-data source before financial use. Calculator results are estimates, not professional advice.

## Tests

Install the development dependencies and run the suite with:

```bash
python -m pip install -r requirements-dev.txt
python -m pytest -q
```

## Containers

Copy `.env.example` to `.env`, replace all placeholder secrets and production IDs, then start the local stack:

```bash
docker compose up --build
```

The frontend is served at `http://localhost:8080`; the API is at `http://localhost:8000`. The Compose stack includes PostgreSQL, pgBouncer, Redis, API, and Nginx, each with a health check.
$ Test

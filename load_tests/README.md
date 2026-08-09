# Platform load test

The Locust shape ramps from 0 to 100 concurrent users in 30 seconds, holds 100 users until the five-minute mark, then stops. Requests are selected at 40% calculators, 30% time tools, and 30% SEO tools; endpoints within a category are selected uniformly.

```sh
locust -f load_tests/locustfile.py --host https://calculator.app --headless
```

The script prints Locust's per-endpoint statistics and a final aggregate with RPS plus p50, p95, and p99 latency. It exits non-zero when p95 is at least 500ms, errors are at least 1%, no requests complete, or connection-pool exhaustion is detected.

For CloudWatch capacity checks, authenticate with a read-only AWS role and set:

```sh
export AWS_REGION=eu-west-2
export RDS_INSTANCE_ID=calculator-prod-postgres
export ELASTICACHE_CLUSTER_ID=calculator-prod-redis-001
export MAX_DB_CONNECTIONS=100 # optional safety limit for the RDS metric
locust -f load_tests/locustfile.py --host https://calculator.app --headless
```

With those variables, the report includes peak RDS CPU, RDS database connections, and ElastiCache memory percentage. RDS CPU at or above 80% fails the run. CloudWatch data can arrive a few minutes late, so use the AWS console to corroborate the final telemetry when assessing a release.

# Monitoring guide

Use the `kalko-production` dashboard for ALB request count/latency and RDS capacity. SNS alarms page on unhealthy targets, low ECS task count, RDS CPU above 80%, and p95 latency above five seconds. Application JSON logs are in `/aws/ecs/kalko-production`; correlate requests using the request ID. Configure Sentry alerts for new issues and rate spikes, and GA4 custom dimensions `domain_name` and `tool_name`.

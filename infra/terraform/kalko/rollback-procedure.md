# Rollback procedure

Use the deployment report to identify `PREVIOUS_TASK_DEFINITION`, then run `aws ecs update-service --cluster kalko-production --service calculator-platform --task-definition <previous-arn> --force-new-deployment` and `aws ecs wait services-stable --cluster kalko-production --services calculator-platform`. Confirm all three health URLs return 200 and that ALB 5xx/latency alarms recover. Preserve logs and Sentry event links for the incident review.

# Calculator.app deployment runbook

## Preconditions

- Confirm `calculator.app`, `time.calculator.app`, and `seo.calculator.app` are the intended production domains. Do not use the separate `infra/terraform/kalko` root for this deployment.
- Apply `infra/terraform` first, using production values for VPC/subnets, image repositories, Route 53 zone, certificate, and database password.
- In GitHub's protected `production` environment, configure `AWS_ROLE_TO_ASSUME` and `SLACK_WEBHOOK_URL`; configure repository variables `AWS_REGION`, `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, `FRONTEND_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`, and `APP_URL=https://calculator.app`.
- Verify the GitHub OIDC deployment role has scoped permissions for ECR, ECS task-definition registration/service updates, S3 publishing, and CloudFront invalidation.

## Release

1. Run `python3 -m pytest -q --cov=app --cov-fail-under=90` and `npm run build` locally.
2. Review the staged changes, commit them to `main`, and push to `origin/main`.
3. In GitHub Actions, follow **Deploy calculator platform**. It tests, builds, publishes an immutable ECR image, deploys ECS, waits for stability, runs all API smoke tests, uploads a deployment report, and notifies Slack.
4. If the workflow fails after ECS is updated, it restores the recorded previous task definition automatically.

## Verification

```sh
curl --fail https://calculator.app/api/v1/health
curl --fail https://time.calculator.app/api/v1/health
curl --fail https://seo.calculator.app/api/v1/health
```

Open each domain in a private browser window and confirm its own tool catalogue, an AdSense preview/production unit, GA4 event delivery, dark-mode toggle, and one successful calculation. Check the CloudWatch dashboard for 30 minutes: error rate under 0.5%, p95 under 500ms, two or more healthy ECS tasks, and no RDS/Redis alarms.

## Rollback

Use the deployment report's `PREVIOUS_TASK_DEFINITION`, then run:

```sh
aws ecs update-service --cluster "$ECS_CLUSTER" --service "$ECS_SERVICE" --task-definition "$PREVIOUS_TASK_DEFINITION" --force-new-deployment
aws ecs wait services-stable --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE"
```

Re-run the three health checks. Capture the failed workflow URL, CloudWatch request IDs, and Sentry issue links before investigating.

# Kalko production runbook

1. Create this root with `terraform init`, set `TF_VAR_database_password`, then apply a reviewed plan with existing VPC/subnet IDs and image URIs.
2. Copy the four `route53_nameservers` output values to the registrar; replacing `ns1.whois.com` delegates DNS to Route 53. Wait for propagation before validating DNS.
3. Confirm ACM validation, ECS desired count two, both ALB targets healthy, and `https://www.kalko.uk/api/v1/health`, `https://time.kalko.uk/api/v1/health`, and `https://seo.kalko.uk/api/v1/health` return 200.
4. Configure the GitHub `production` environment with `AWS_ROLE_TO_ASSUME`, `SLACK_WEBHOOK_URL`, and variables `AWS_REGION`, `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, and `APP_URL`.
5. Monitor CloudWatch and Sentry for 30 minutes after release. Do not deploy during an active alarm.

# Production deployment workflow

The `deploy-production.yml` workflow runs on pushes to `main` and uses GitHub OIDC to assume an AWS deployment role. This avoids long-lived AWS access-key secrets.

Create a protected GitHub `production` environment, then configure these repository or environment variables:

| Variable | Purpose |
| --- | --- |
| `AWS_REGION` | AWS deployment region, for example `eu-west-2` |
| `ECR_REPOSITORY` | ECR API repository name |
| `ECS_CLUSTER` | ECS cluster name |
| `ECS_SERVICE` | ECS service name |
| `FRONTEND_BUCKET` | CloudFront origin S3 bucket name, without `s3://` |
| `CLOUDFRONT_DISTRIBUTION_ID` | Distribution to invalidate after publishing the bundle |
| `APP_URL` | Public HTTPS base URL, for example `https://calculator.app` |

Configure these secrets:

| Secret | Purpose |
| --- | --- |
| `AWS_ROLE_TO_ASSUME` | IAM role ARN trusted by this repository's GitHub OIDC subject |
| `SLACK_WEBHOOK_URL` | Optional Slack incoming-webhook URL for success/failure notifications |

The role needs only ECR image push, ECS service/task-definition read and update, S3 object sync for the frontend bucket, CloudFront invalidation, and CloudWatch Logs access if the role policy requires it. Restrict resource ARNs to this platform's repositories, cluster/service, bucket, and distribution.

Each API image is tagged with its immutable commit SHA. Before deployment, the workflow records the active task-definition ARN. A task-definition registration, ECS stability wait, or smoke-test failure causes the service to return to that recorded revision. The frontend bucket should have S3 versioning enabled so its assets can also be recovered through AWS if required.

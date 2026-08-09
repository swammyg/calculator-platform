# Calculator Platform AWS infrastructure

This Terraform root deploys one ECS Fargate service containing the frontend, FastAPI API, and a PgBouncer sidecar. It provisions an internet-facing ALB, CloudFront, Route 53 aliases, ACM certificates, PostgreSQL, Redis, CloudWatch logging and alarms, and narrowly scoped ECS IAM roles.

## Prerequisites

- Terraform 1.6 or newer and AWS credentials for the selected account.
- An existing VPC with at least two public and two private subnets in the target region.
- A Route 53 hosted zone for `calculator.app`.
- Published backend and frontend container image URIs.

CloudFront certificates are deliberately issued in `us-east-1`; the ALB certificate is issued in `aws_region`. DNS validation records and the base/wildcard Route 53 aliases are managed here.

## Deploy an environment

Copy the matching example, fill in the VPC, subnet, image, and hosted-zone values, then provide the database password through the environment rather than committing it.

```sh
cp environments/prod.tfvars.example environments/prod.tfvars
export TF_VAR_database_password='use-a-long-unique-secret'
terraform init
terraform plan -var-file=environments/prod.tfvars
terraform apply -var-file=environments/prod.tfvars
```

Use `dev.tfvars.example`, `staging.tfvars.example`, or `prod.tfvars.example` as the separate environment inputs. The generated state contains the database connection secret because Terraform must create it; keep remote state encrypted and access-controlled (for example, an S3 backend with KMS and state locking).

## Operational details

- The ALB redirects HTTP to HTTPS and routes `/api/*` to FastAPI on port 8000; all other requests go to the frontend on port 80.
- The API target health check is `/api/v1/health`.
- ECS scales from 1 to 3 tasks around 70% CPU.
- CloudFront bypasses caching for `/api/*`, caches `/static/*` and Vite `/assets/*` for one day, and `/images/*` for one week.
- Application logs use `/aws/ecs/calculator-platform`, with container-specific stream prefixes. Alarms cover ALB 5xx error rate above 1% and p95 target response time above five seconds.

The security groups keep database and Redis ports private to ECS tasks; only the ALB accepts public HTTP/HTTPS traffic.

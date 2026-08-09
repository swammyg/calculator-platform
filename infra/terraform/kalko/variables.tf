variable "aws_region" { type = string; default = "eu-west-2" }
variable "environment" { type = string; default = "production" }
variable "domain_name" { type = string; default = "kalko.uk" }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "database_password" { type = string; sensitive = true }
variable "backend_image" { type = string }
variable "frontend_image" { type = string }
variable "github_repository" { type = string }
variable "alert_email" { type = string }
variable "sentry_dsn" { type = string; sensitive = true; default = "" }
variable "tags" { type = map(string); default = {} }

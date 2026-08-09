output "route53_nameservers" { value = aws_route53_zone.main.name_servers }
output "alb_dns_name" { value = aws_lb.main.dns_name }
output "rds_endpoint" { value = aws_db_instance.main.address }
output "redis_endpoint" { value = aws_elasticache_replication_group.main.primary_endpoint_address }
output "backend_ecr_url" { value = aws_ecr_repository.backend.repository_url }
output "github_role_arn" { value = aws_iam_role.github.arn }

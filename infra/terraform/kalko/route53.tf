resource "aws_route53_zone" "main" { name = var.domain_name }
resource "aws_route53_record" "web" { for_each = toset(["www", "time", "seo", "api"]); zone_id = aws_route53_zone.main.zone_id; name = "${each.key}.${var.domain_name}"; type = "A"; alias { name = aws_lb.main.dns_name; zone_id = aws_lb.main.zone_id; evaluate_target_health = true } }
resource "aws_route53_record" "apex" { zone_id = aws_route53_zone.main.zone_id; name = var.domain_name; type = "A"; alias { name = aws_lb.main.dns_name; zone_id = aws_lb.main.zone_id; evaluate_target_health = true } }

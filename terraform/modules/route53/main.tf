# Create A record for apex domain pointing to CloudFront
resource "aws_route53_record" "apex" {
  zone_id         = var.zone_id
  name            = var.domain_name
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = var.cloudfront_distribution_domain_name
    zone_id                = var.cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

# Create A record for www subdomain pointing to CloudFront
resource "aws_route53_record" "www" {
  zone_id         = var.zone_id
  name            = "www.${var.domain_name}"
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = var.cloudfront_distribution_domain_name
    zone_id                = var.cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

# Get the existing Route53 hosted zone for the domain
data "aws_route53_zone" "zone" {
  name = var.domain_name
  # If the zone is private, set this to true
  private_zone = false
}

# Create A record for the apex domain (robmclaughl.in)
resource "aws_route53_record" "apex" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.cloudfront_distribution_domain_name
    zone_id                = var.cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

# Create A record for the www subdomain (www.robmclaughl.in)
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.zone.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.cloudfront_distribution_domain_name
    zone_id                = var.cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

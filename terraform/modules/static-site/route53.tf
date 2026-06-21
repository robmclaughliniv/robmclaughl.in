# DNS alias records in the shared hosted zone pointing at this distribution.
# Subdomain mode creates records for the FQDN only; root mode also adds www.

resource "aws_route53_record" "primary_a" {
  zone_id         = data.aws_route53_zone.root.zone_id
  name            = local.fqdn
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "primary_aaaa" {
  zone_id         = data.aws_route53_zone.root.zone_id
  name            = local.fqdn
  type            = "AAAA"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_a" {
  count           = local.is_subdomain ? 0 : 1
  zone_id         = data.aws_route53_zone.root.zone_id
  name            = "www.${var.root_domain}"
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_aaaa" {
  count           = local.is_subdomain ? 0 : 1
  zone_id         = data.aws_route53_zone.root.zone_id
  name            = "www.${var.root_domain}"
  type            = "AAAA"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

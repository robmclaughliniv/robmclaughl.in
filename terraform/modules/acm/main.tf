# ACM Certificate for the domain
# CloudFront requires certificates to be in us-east-1 region
resource "aws_acm_certificate" "cert" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = var.subject_alternative_names
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation records for the certificate
resource "aws_route53_record" "cert_validation" {
  provider = aws # Explicitly use the default provider (us-west-2) for Route53 records
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.zone_id
  
  # We need to be more careful with DNS records as they might already exist
  lifecycle {
    # Allow creation even if records exist (reduce likelihood of conflict)
    create_before_destroy = true
  }
}

# Certificate validation
resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

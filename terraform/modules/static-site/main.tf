# ---------------------------------------------------------------------------
# Derived values
# ---------------------------------------------------------------------------

locals {
  is_subdomain = var.subdomain != ""

  # The fully-qualified primary domain this app serves.
  fqdn = local.is_subdomain ? "${var.subdomain}.${var.root_domain}" : var.root_domain

  # CloudFront aliases: subdomain mode serves just the FQDN; root mode serves
  # the apex plus www.
  aliases = local.is_subdomain ? [local.fqdn] : [var.root_domain, "www.${var.root_domain}"]

  # Collision-free naming prefix derived from the FQDN (dots -> dashes).
  name_prefix = replace(local.fqdn, ".", "-")

  bucket_name = coalesce(var.bucket_name, "${local.name_prefix}-website")

  s3_origin_id  = "S3-${local.bucket_name}"
  api_origin_id = "APIGW-${local.name_prefix}"

  oidc_subjects = var.allowed_oidc_subjects != null ? var.allowed_oidc_subjects : ["repo:${var.repo}:*"]

  # Reuse the shared response-headers policy unless a CSP override forces a
  # per-app policy.
  response_headers_policy_id = var.csp_override != null ? aws_cloudfront_response_headers_policy.override[0].id : data.aws_cloudfront_response_headers_policy.shared[0].id

  # CloudFront custom error responses: SPA fallback vs static-export 404.
  error_responses = var.spa_mode ? [
    {
      error_code            = 403
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 0
    },
    {
      error_code            = 404
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 0
    },
    ] : [
    {
      error_code            = 404
      response_code         = 404
      response_page_path    = "/404.html"
      error_caching_min_ttl = 0
    },
  ]

  tags = merge(
    {
      Project   = var.root_domain
      App       = var.app_name
      ManagedBy = "terraform"
    },
    var.tags,
  )
}

# ---------------------------------------------------------------------------
# Account / region context
# ---------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# ---------------------------------------------------------------------------
# Shared primitives — looked up read-only, owned by the root infrastructure.
# This module NEVER creates or mutates the hosted zone, the ACM certificate,
# or the WAF Web ACL.
# ---------------------------------------------------------------------------

data "aws_route53_zone" "root" {
  name         = "${var.root_domain}."
  private_zone = false
}

# The shared certificate's primary domain is the root domain; it carries the
# *.<root_domain> SAN that covers every single-level subdomain app.
data "aws_acm_certificate" "cert" {
  provider    = aws.us_east_1
  domain      = var.root_domain
  statuses    = ["ISSUED"]
  most_recent = true
}

data "aws_wafv2_web_acl" "shared" {
  count    = var.enable_waf ? 1 : 0
  provider = aws.us_east_1
  name     = var.waf_name
  scope    = "CLOUDFRONT"
}

data "aws_cloudfront_response_headers_policy" "shared" {
  count = var.csp_override == null ? 1 : 0
  name  = var.response_headers_policy_name
}

# AWS-managed cache / origin-request policies.
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  count = var.enable_api ? 1 : 0
  name  = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  count = var.enable_api ? 1 : 0
  name  = "Managed-AllViewerExceptHostHeader"
}

# Origin Access Control so the private S3 bucket is reachable only via CloudFront.
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${local.name_prefix}-oac"
  description                       = "OAC for ${local.fqdn}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Rewrites directory-style requests to index.html (e.g. /foo -> /foo/index.html).
resource "aws_cloudfront_function" "index_rewrite" {
  count   = var.enable_index_rewrite ? 1 : 0
  name    = "${local.name_prefix}-index-rewrite"
  runtime = "cloudfront-js-1.0"
  comment = "Rewrites directory requests to index.html for ${local.fqdn}"
  publish = true

  code = <<-EOT
    function handler(event) {
        var request = event.request;
        var uri = request.uri;

        if (uri.endsWith('/')) {
            request.uri += 'index.html';
        } else if (!uri.includes('.')) {
            request.uri += '/index.html';
        }

        return request;
    }
  EOT
}

# Per-app response-headers policy, created only when a CSP override is supplied.
# Mirrors the shared security headers but with a custom Content-Security-Policy.
resource "aws_cloudfront_response_headers_policy" "override" {
  count = var.csp_override != null ? 1 : 0
  name  = "${local.name_prefix}-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_security_policy {
      content_security_policy = var.csp_override
      override                = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}

resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = local.aliases
  price_class         = var.price_class
  comment             = local.fqdn
  web_acl_id          = var.enable_waf ? data.aws_wafv2_web_acl.shared[0].arn : null

  # S3 static content origin.
  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  # Optional API Gateway origin for /api/*.
  dynamic "origin" {
    for_each = var.enable_api ? [1] : []

    content {
      domain_name = "${aws_apigatewayv2_api.api[0].id}.execute-api.${data.aws_region.current.region}.amazonaws.com"
      origin_id   = local.api_origin_id

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
  }

  default_cache_behavior {
    target_origin_id           = local.s3_origin_id
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    viewer_protocol_policy     = "redirect-to-https"
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = local.response_headers_policy_id

    dynamic "function_association" {
      for_each = var.enable_index_rewrite ? [1] : []

      content {
        event_type   = "viewer-request"
        function_arn = aws_cloudfront_function.index_rewrite[0].arn
      }
    }
  }

  # /api/* -> API Gateway, uncached, forwarding everything except Host.
  dynamic "ordered_cache_behavior" {
    for_each = var.enable_api ? [1] : []

    content {
      path_pattern               = "/api/*"
      target_origin_id           = local.api_origin_id
      allowed_methods            = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods             = ["GET", "HEAD"]
      viewer_protocol_policy     = "redirect-to-https"
      cache_policy_id            = data.aws_cloudfront_cache_policy.caching_disabled[0].id
      origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.all_viewer_except_host[0].id
      response_headers_policy_id = local.response_headers_policy_id
    }
  }

  dynamic "custom_error_response" {
    for_each = local.error_responses

    content {
      error_code            = custom_error_response.value.error_code
      response_code         = custom_error_response.value.response_code
      response_page_path    = custom_error_response.value.response_page_path
      error_caching_min_ttl = custom_error_response.value.error_caching_min_ttl
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  dynamic "logging_config" {
    for_each = var.logs_bucket != "" ? [1] : []

    content {
      include_cookies = false
      bucket          = "${var.logs_bucket}.s3.${data.aws_region.current.region}.amazonaws.com"
      prefix          = var.logs_prefix
    }
  }

  tags = local.tags
}

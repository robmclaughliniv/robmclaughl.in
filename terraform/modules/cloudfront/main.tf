# Keep the existing Origin Access Identity (OAI) to prevent deletion errors
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.bucket_name} (preserved for migration)"
  
  # Prevent Terraform from trying to delete this resource
  lifecycle {
    prevent_destroy = true
  }
}

# Create a Response Headers Policy for security headers
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "security-headers-policy"
  
  security_headers_config {
    # Strict Transport Security: Enforce HTTPS
    strict_transport_security {
      access_control_max_age_sec = 31536000 # 1 year
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    
    # Content-Security-Policy: Restrict sources of content
    content_security_policy {
      content_security_policy = "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; frame-src 'none';"
      override                = true
    }
    
    # X-Content-Type-Options: Prevent MIME type sniffing
    content_type_options {
      override = true
    }
    
    # X-Frame-Options: Prevent clickjacking
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    
    # Referrer-Policy: Control referrer information
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    
    # X-XSS-Protection: Legacy XSS protection for older browsers
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}

# Create an Origin Access Control (OAC) for CloudFront S3 origins
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${var.bucket_name}-oac"
  description                       = "OAC for ${var.bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "website" {
  origin {
    domain_name              = var.bucket_regional_domain_name
    origin_id                = "S3-${var.bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id # Use OAC instead of OAI
    
    # Note: We're not using s3_origin_config with OAI anymore, but keeping the OAI resource
    # to prevent deletion errors during migration
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = var.domain_names
  price_class         = "PriceClass_100" # Use only US and Europe edge locations

  # Configure caching
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    
    # Apply the security headers policy
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Handle 404 errors with custom error response
  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Logging configuration
  dynamic "logging_config" {
    for_each = var.logs_bucket != "" ? [1] : []
    content {
      include_cookies = false
      bucket          = "${var.logs_bucket}.s3.${data.aws_region.current.name}.amazonaws.com"
      prefix          = var.logs_prefix
    }
  }
}

# Get current AWS region for constructing the logs bucket domain name
data "aws_region" "current" {}

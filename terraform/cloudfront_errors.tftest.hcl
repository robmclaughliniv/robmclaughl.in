# Plans the apex CloudFront module with a mocked AWS provider. No AWS API
# calls. Asserts a missing object (S3/OAC 403) and a real 404 both render the
# Next.js static-export 404 page with HTTP 404, and that Permissions-Policy
# no longer names bluetooth or document-domain.

mock_provider "aws" {
  mock_data "aws_region" {
    defaults = {
      name = "us-west-2"
    }
  }
}

run "missing_paths_map_to_real_404" {
  command = plan

  module {
    source = "./modules/cloudfront"
  }

  variables {
    bucket_name                 = "robmclaughl-in-website-bucket"
    bucket_regional_domain_name = "robmclaughl-in-website-bucket.s3.us-west-2.amazonaws.com"
    bucket_arn                  = "arn:aws:s3:::robmclaughl-in-website-bucket"
    acm_certificate_arn         = "arn:aws:acm:us-east-1:123456789012:certificate/00000000-0000-0000-0000-000000000000"
    domain_names                = ["robmclaughl.in", "www.robmclaughl.in"]
    index_rewrite_paths         = ["/branch/*"]
    logs_bucket                 = ""
  }

  assert {
    condition = length([
      for response in aws_cloudfront_distribution.website.custom_error_response : response
      if response.error_code == 403 && response.response_code == 404 && response.response_page_path == "/404.html" && response.error_caching_min_ttl == 10
    ]) == 1
    error_message = "Origin 403 (S3 missing key behind OAC) must render /404.html with HTTP 404 and a 10s error cache."
  }

  assert {
    condition = length([
      for response in aws_cloudfront_distribution.website.custom_error_response : response
      if response.error_code == 404 && response.response_code == 404 && response.response_page_path == "/404.html" && response.error_caching_min_ttl == 10
    ]) == 1
    error_message = "Origin 404 must render /404.html with HTTP 404 and a 10s error cache."
  }

  assert {
    condition     = length(aws_cloudfront_distribution.website.custom_error_response) == 2
    error_message = "Missing pages must not fall through to an SPA /index.html 200 response. Only 403 and 404 are customized."
  }

  assert {
    condition = alltrue([
      for response in aws_cloudfront_distribution.website.custom_error_response :
      response.response_page_path != "/index.html" && response.response_code != 200
    ])
    error_message = "This distribution is a static export. Error responses must not rewrite to /index.html with HTTP 200."
  }

  assert {
    condition = anytrue([
      for block in aws_cloudfront_response_headers_policy.security_headers.custom_headers_config : anytrue([
        for item in block.items :
        item.header == "Permissions-Policy" && item.value == "accelerometer=(), browsing-topics=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), hid=(), interest-cohort=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), sync-xhr=(), usb=(), xr-spatial-tracking=()" && !strcontains(item.value, "bluetooth") && !strcontains(item.value, "document-domain")
      ])
    ])
    error_message = "Permissions-Policy must match the shared value and must not include bluetooth or document-domain."
  }
}

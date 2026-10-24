# Plans the shared static-site module with mocked AWS providers. No AWS API
# calls. spa_mode stays the switch: static exports get a real 404, SPAs keep
# the /index.html 200 fallback. Callers do not have to set a new variable.

mock_provider "aws" {
  mock_data "aws_region" {
    defaults = {
      name   = "us-west-2"
      region = "us-west-2"
    }
  }

  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "123456789012"
    }
  }

  mock_data "aws_route53_zone" {
    defaults = {
      zone_id = "Z0123456789EXAMPLE"
      name    = "robmclaughl.in."
    }
  }

  mock_data "aws_cloudfront_cache_policy" {
    defaults = {
      id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    }
  }

  mock_data "aws_cloudfront_response_headers_policy" {
    defaults = {
      id = "67f7725c-6f97-4210-82d7-5512b31e9d03"
    }
  }
}

mock_provider "aws" {
  alias = "us_east_1"

  mock_data "aws_acm_certificate" {
    defaults = {
      arn = "arn:aws:acm:us-east-1:123456789012:certificate/00000000-0000-0000-0000-000000000000"
    }
  }
}

run "static_export_maps_403_and_404" {
  command = plan

  variables {
    app_name  = "example-site"
    subdomain = "example-site"
    repo      = "robmclaughliniv/example-site"
    spa_mode  = false
  }

  assert {
    condition = jsonencode(module.site.custom_error_responses) == jsonencode([
      {
        error_code            = 403
        response_code         = 404
        response_page_path    = "/404.html"
        error_caching_min_ttl = 10
      },
      {
        error_code            = 404
        response_code         = 404
        response_page_path    = "/404.html"
        error_caching_min_ttl = 10
      },
    ])
    error_message = "spa_mode false must map origin 403 and 404 to /404.html with HTTP 404."
  }
}

run "spa_mode_keeps_index_fallback" {
  command = plan

  variables {
    app_name  = "example-spa"
    subdomain = "example-spa"
    repo      = "robmclaughliniv/example-spa"
    spa_mode  = true
  }

  assert {
    condition = jsonencode(module.site.custom_error_responses) == jsonencode([
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
    ])
    error_message = "spa_mode true must keep the /index.html HTTP 200 fallback for 403 and 404."
  }
}

run "csp_override_header_omits_unrecognized_features" {
  command = plan

  variables {
    app_name     = "example-csp"
    subdomain    = "example-csp"
    repo         = "robmclaughliniv/example-csp"
    csp_override = "default-src 'self'"
  }

  assert {
    condition     = module.site.override_permissions_policy == "accelerometer=(), browsing-topics=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), hid=(), interest-cohort=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), sync-xhr=(), usb=(), xr-spatial-tracking=()" && !strcontains(module.site.override_permissions_policy, "bluetooth") && !strcontains(module.site.override_permissions_policy, "document-domain")
    error_message = "Per-app CSP override policy must use the same Permissions-Policy value, without bluetooth or document-domain."
  }
}

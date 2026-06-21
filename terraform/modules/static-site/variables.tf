# ---------------------------------------------------------------------------
# Identity / addressing
# ---------------------------------------------------------------------------

variable "app_name" {
  description = "Short, human-readable application name (used in tags and as a fallback for resource naming). Example: \"craps-trainer\"."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,40}$", var.app_name))
    error_message = "app_name must be lowercase alphanumeric/hyphens, start with a letter or digit, and be <= 41 chars."
  }
}

variable "root_domain" {
  description = "The shared apex domain whose Route53 hosted zone and *.<root_domain> ACM certificate already exist."
  type        = string
  default     = "robmclaughl.in"
}

variable "subdomain" {
  description = "Single-level subdomain label to deploy under (e.g. \"craps-trainer\" => craps-trainer.<root_domain>). Leave empty (\"\") to deploy at the apex + www (root mode)."
  type        = string
  default     = ""

  validation {
    condition     = var.subdomain == "" || can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$", var.subdomain))
    error_message = "subdomain must be a single DNS label (lowercase alphanumeric/hyphens, no dots) so it is covered by the *.<root_domain> wildcard certificate."
  }
}

variable "repo" {
  description = "GitHub repository in \"owner/name\" form, used to scope the GitHub Actions OIDC trust policy."
  type        = string

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.repo))
    error_message = "repo must be in \"owner/name\" form (exactly one slash)."
  }
}

variable "allowed_oidc_subjects" {
  description = "Optional explicit list of GitHub OIDC `sub` claims allowed to assume the deploy role. When null, defaults to [\"repo:<repo>:*\"]. Tighten to e.g. [\"repo:<repo>:ref:refs/heads/master\"] for least privilege."
  type        = list(string)
  default     = null
}

variable "bucket_name" {
  description = "Override for the website S3 bucket name. When null, derived from the FQDN as \"<fqdn-with-dashes>-website\"."
  type        = string
  default     = null
}

# ---------------------------------------------------------------------------
# CloudFront / delivery
# ---------------------------------------------------------------------------

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "enable_index_rewrite" {
  description = "Attach a CloudFront Function that rewrites directory-style URIs to index.html (needed for static-export sites with pretty URLs)."
  type        = bool
  default     = true
}

variable "spa_mode" {
  description = "When true, serve /index.html (HTTP 200) for 403/404 responses (single-page apps with client-side routing). When false, serve /404.html (HTTP 404) — appropriate for static-export sites."
  type        = bool
  default     = false
}

variable "csp_override" {
  description = "Optional Content-Security-Policy string. When set, the module creates its own response-headers policy (cloning the shared security headers) with this CSP instead of reusing the shared policy."
  type        = string
  default     = null
}

# ---------------------------------------------------------------------------
# Shared primitives (read-only lookups; never created or mutated here)
# ---------------------------------------------------------------------------

variable "enable_waf" {
  description = "Associate the shared CLOUDFRONT-scoped WAF Web ACL with this distribution."
  type        = bool
  default     = true
}

variable "waf_name" {
  description = "Name of the shared CLOUDFRONT-scoped WAF Web ACL (in us-east-1) to look up and attach."
  type        = string
  default     = "robmclaughl-in-waf-acl"
}

variable "response_headers_policy_name" {
  description = "Name of the shared CloudFront response-headers policy to reuse when csp_override is not set."
  type        = string
  default     = "security-headers-policy"
}

# ---------------------------------------------------------------------------
# Access logging (optional)
# ---------------------------------------------------------------------------

variable "logs_bucket" {
  description = "Optional S3 bucket name for CloudFront access logs. Empty disables logging."
  type        = string
  default     = ""
}

variable "logs_prefix" {
  description = "Prefix for CloudFront access logs within logs_bucket."
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# Optional same-origin /api/* add-on (Lambda + HTTP API Gateway)
# ---------------------------------------------------------------------------

variable "enable_api" {
  description = "Provision a Lambda-backed HTTP API and route /api/* through CloudFront to it (same-origin, no CORS)."
  type        = bool
  default     = false
}

variable "enable_dynamodb" {
  description = "Create a PAY_PER_REQUEST DynamoDB table for the API Lambda and grant it write access. Only relevant when enable_api is true."
  type        = bool
  default     = false
}

variable "dynamodb_primary_key" {
  description = "Partition key name for the optional DynamoDB table (string-typed)."
  type        = string
  default     = "id"
}

variable "lambda_handler" {
  description = "Lambda handler entrypoint."
  type        = string
  default     = "index.handler"
}

variable "lambda_runtime" {
  description = "Lambda runtime identifier."
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory_size" {
  description = "Lambda memory (MB)."
  type        = number
  default     = 128
}

variable "lambda_timeout" {
  description = "Lambda timeout (seconds)."
  type        = number
  default     = 10
}

variable "lambda_environment" {
  description = "Extra environment variables for the API Lambda (merged with the DynamoDB table name when enable_dynamodb is true)."
  type        = map(string)
  default     = {}
}

# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------

variable "tags" {
  description = "Additional tags merged into all taggable resources created by this module."
  type        = map(string)
  default     = {}
}

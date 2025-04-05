variable "bucket_name" {
  description = "Name of the S3 bucket hosting the website content"
  type        = string
}

variable "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  type        = string
}

variable "bucket_arn" {
  description = "ARN of the S3 bucket hosting the website content"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for SSL"
  type        = string
}

variable "domain_names" {
  description = "List of domain names for the CloudFront distribution"
  type        = list(string)
  default     = []
}

variable "logs_bucket" {
  description = "Name of the S3 bucket for CloudFront access logs (optional)"
  type        = string
  default     = ""
}

variable "logs_prefix" {
  description = "Prefix for CloudFront access logs within the logs bucket (optional)"
  type        = string
  default     = ""
}

variable "index_rewrite_paths" {
  description = "List of CloudFront path patterns that require index.html rewrite (e.g., '/branch/*')"
  type        = list(string)
  default     = []
}

variable "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL to associate with the CloudFront distribution (optional)"
  type        = string
  default     = null
}

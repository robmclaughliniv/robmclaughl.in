variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  type        = string
}

variable "bucket_arn" {
  description = "ARN of the S3 bucket"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  type        = string
}

variable "domain_names" {
  description = "Domain names for the CloudFront distribution"
  type        = list(string)
}

variable "logs_bucket" {
  description = "Name of the S3 bucket for CloudFront logs"
  type        = string
  default     = ""
}

variable "logs_prefix" {
  description = "Prefix for CloudFront logs in the logs bucket"
  type        = string
  default     = "cloudfront-logs/"
}

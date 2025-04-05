variable "bucket_name" {
  description = "The name of the S3 bucket"
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "The ARN of the CloudFront distribution that needs access"
  type        = string
  default     = ""
}

variable "is_logs_bucket" {
  description = "Whether this bucket is used for CloudFront logs (requires ACL access)"
  type        = bool
  default     = false
}

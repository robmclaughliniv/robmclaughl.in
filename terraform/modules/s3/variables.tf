variable "bucket_name" {
  description = "The name of the S3 bucket"
  type        = string
}

variable "create_bucket" {
  description = "Boolean flag to control whether the bucket resource should be created."
  type        = bool
  default     = true
}

variable "is_logs_bucket" {
  description = "Whether this bucket is used for CloudFront logs (requires ACL access)"
  type        = bool
  default     = false
}

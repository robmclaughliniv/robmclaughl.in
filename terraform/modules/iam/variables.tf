variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "bucket_arn" {
  description = "ARN of the S3 bucket"
  type        = string
}

variable "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  type        = string
}

variable "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  type        = string
}

variable "github_owner" {
  description = "Owner of the GitHub repository"
  type        = string
  default     = "robmclaughliniv" # Replace with your GitHub username or organization
}

variable "github_repo" {
  description = "Name of the GitHub repository"
  type        = string
  default     = "robmclaughl.in" # The repository name
}
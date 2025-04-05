output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = var.bucket_name
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = local.bucket_arn
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = local.create_bucket ? aws_s3_bucket.website[0].bucket_regional_domain_name : "${var.bucket_name}.s3.${data.aws_region.current.name}.amazonaws.com"
}

# Get current AWS region
data "aws_region" "current" {}

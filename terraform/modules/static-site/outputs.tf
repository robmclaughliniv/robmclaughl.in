output "site_url" {
  description = "Public HTTPS URL of the deployed site."
  value       = "https://${local.fqdn}"
}

output "fqdn" {
  description = "Fully-qualified primary domain served by this distribution."
  value       = local.fqdn
}

output "bucket_name" {
  description = "Name of the website content S3 bucket (CI sync target)."
  value       = aws_s3_bucket.website.id
}

output "bucket_arn" {
  description = "ARN of the website content S3 bucket."
  value       = aws_s3_bucket.website.arn
}

output "distribution_id" {
  description = "CloudFront distribution ID (CI invalidation target)."
  value       = aws_cloudfront_distribution.website.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = aws_cloudfront_distribution.website.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name (e.g. dxxxx.cloudfront.net)."
  value       = aws_cloudfront_distribution.website.domain_name
}

output "role_arn" {
  description = "ARN of the GitHub Actions OIDC deploy role (set as the CI AWS role)."
  value       = aws_iam_role.gha.arn
}

output "role_name" {
  description = "Name of the GitHub Actions OIDC deploy role."
  value       = aws_iam_role.gha.name
}

output "lambda_function_name" {
  description = "Name of the API Lambda (CI code-deploy target), or null when the API add-on is disabled."
  value       = var.enable_api ? aws_lambda_function.api[0].function_name : null
}

output "api_endpoint" {
  description = "Direct invoke URL of the HTTP API, or null when the API add-on is disabled. Public traffic should use /api/* via the site URL."
  value       = var.enable_api ? aws_apigatewayv2_api.api[0].api_endpoint : null
}

output "dynamodb_table_name" {
  description = "Name of the API DynamoDB table, or null when not enabled."
  value       = var.enable_api && var.enable_dynamodb ? aws_dynamodb_table.api[0].name : null
}

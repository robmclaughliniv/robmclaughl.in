# Main Terraform configuration file for robmclaughl.in
provider "aws" {
  region = "us-west-2"
  
  # Credentials are loaded from AWS CLI configuration
  
  # You can specify default tags to add to all resources
  default_tags {
    tags = {
      Project     = "robmclaughl.in"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront requires ACM certificates to be in us-east-1 region
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  # Credentials are loaded from AWS CLI configuration
  
  # You can specify default tags to add to all resources
  default_tags {
    tags = {
      Project     = "robmclaughl.in"
      Environment = "production"
      ManagedBy   = "terraform"
    }
  }
}

# Backend configuration for Terraform state
terraform {
  backend "s3" {
    bucket         = "robmclaughl-in-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

# Phase 1: Create S3 buckets without bucket policies
module "website_bucket" {
  source = "./modules/s3"
  bucket_name = "robmclaughl-in-website-bucket"
  # CloudFront ARN will be applied in Phase 3
}

# S3 bucket for CloudFront logs
module "logs_bucket" {
  source = "./modules/s3"
  bucket_name = "robmclaughl-in-logs-bucket"
  is_logs_bucket = true  # Enable ACLs for CloudFront logging
  # CloudFront ARN will be applied in Phase 3
}

# ACM Certificate
module "acm" {
  source = "./modules/acm"
  domain_name = "robmclaughl.in"
  subject_alternative_names = ["www.robmclaughl.in"]
  zone_id = module.route53.zone_id
  
  providers = {
    aws           = aws # Explicitly pass the default provider
    aws.us_east_1 = aws.us_east_1
  }
}

# CloudFront Distribution
module "cloudfront" {
  source = "./modules/cloudfront"
  bucket_name = module.website_bucket.bucket_name
  bucket_regional_domain_name = module.website_bucket.bucket_regional_domain_name
  bucket_arn = module.website_bucket.bucket_arn
  acm_certificate_arn = module.acm.certificate_arn
  domain_names = ["robmclaughl.in", "www.robmclaughl.in"]
  logs_bucket = module.logs_bucket.bucket_name
  logs_prefix = "cloudfront-logs/"
}

# Route53 configuration
module "route53" {
  source = "./modules/route53"
  domain_name = "robmclaughl.in"
  zone_id     = "Z2PPIVE6CKK74T" # Pass the correct Zone ID directly (without trailing X)
  cloudfront_distribution_domain_name = module.cloudfront.distribution_domain_name
  cloudfront_distribution_zone_id = module.cloudfront.distribution_zone_id
}

# IAM Role for GitHub Actions
module "github_actions" {
  source = "./modules/iam"
  bucket_name = module.website_bucket.bucket_name
  bucket_arn = module.website_bucket.bucket_arn
  cloudfront_distribution_arn = module.cloudfront.distribution_arn
  cloudfront_distribution_id = module.cloudfront.distribution_id
  github_owner = "robmclaughliniv" # Update with your actual GitHub username
  github_repo = "robmclaughl.in" # Update with your actual repository name
  
  # Ensure this runs after the buckets, CloudFront, and bucket policies are created
  depends_on = [
    module.website_bucket,
    module.logs_bucket,
    module.cloudfront,
    module.website_bucket_policy,
    module.logs_bucket_policy
  ]
}

# Phase 3: Apply bucket policies with CloudFront ARN
module "website_bucket_policy" {
  source = "./modules/s3"
  bucket_name = module.website_bucket.bucket_name
  cloudfront_distribution_arn = module.cloudfront.distribution_arn
  
  # Ensure this runs after the buckets and CloudFront are created
  depends_on = [module.website_bucket, module.cloudfront]
}

module "logs_bucket_policy" {
  source = "./modules/s3"
  bucket_name = module.logs_bucket.bucket_name
  cloudfront_distribution_arn = module.cloudfront.distribution_arn
  is_logs_bucket = true  # Enable ACLs for CloudFront logging
  
  # Ensure this runs after the buckets and CloudFront are created
  depends_on = [module.logs_bucket, module.cloudfront]
}

# Output values
output "website_bucket_name" {
  description = "Name of the S3 bucket hosting the website content"
  value       = module.website_bucket.bucket_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cloudfront.distribution_domain_name
}

output "website_url" {
  description = "URL of the website"
  value       = "https://robmclaughl.in"
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions"
  value       = module.github_actions.role_arn
}

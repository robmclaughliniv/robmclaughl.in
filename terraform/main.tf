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
  index_rewrite_paths = ["/branch/*"] # Add list of paths requiring index rewrite
  waf_web_acl_arn = aws_wafv2_web_acl.main_waf_acl.arn # Pass the WAF ARN
}

# Route53 configuration
module "route53" {
  source = "./modules/route53"
  domain_name = "robmclaughl.in"
  zone_id     = "Z2PPIVE6CKK74T" # Pass the correct Zone ID directly (without trailing X)
  cloudfront_distribution_domain_name = module.cloudfront.distribution_domain_name
  cloudfront_distribution_zone_id = module.cloudfront.distribution_zone_id
}

# WAF Web ACL for CloudFront
# Note: Rules can incur costs based on usage.
resource "aws_wafv2_web_acl" "main_waf_acl" {
  provider    = aws.us_east_1 # Specify the correct provider for CLOUDFRONT scope
  name        = "robmclaughl-in-waf-acl"
  description = "WAF Web ACL for robmclaughl.in CloudFront distribution"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # AWS Managed Common Rule Set - Covers OWASP Top 10 and other common threats
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10
    override_action {
      none {} # Use the actions defined within the rule group
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "awsCommonRules"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Amazon IP Reputation List - Blocks known malicious IPs
  rule {
    name     = "AWSManagedRulesAmazonIpReputationList"
    priority = 20
    override_action {
      none {} # Use the actions defined within the rule group
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "awsIpReputation"
      sampled_requests_enabled   = true
    }
  }

  # General visibility configuration for the ACL itself
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "mainWafAcl"
    sampled_requests_enabled   = true
  }
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

# Add WAF ACL ARN output
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL associated with CloudFront"
  value       = aws_wafv2_web_acl.main_waf_acl.arn
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions"
  value       = module.github_actions.role_arn
}

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

# S3 bucket for website content
module "website_bucket" {
  source = "./modules/s3"
  bucket_name = "robmclaughl-in-website-bucket"
  # Only create the bucket in the production workspace
  create_bucket = terraform.workspace == "prod"
}

# S3 bucket for CloudFront logs
module "logs_bucket" {
  source = "./modules/s3"
  bucket_name = "robmclaughl-in-logs-bucket"
  is_logs_bucket = true # Enable ACLs for CloudFront logging
  # Only create the bucket in the production workspace
  create_bucket = terraform.workspace == "prod"
}

# ACM Certificate (Only create in prod)
module "acm" {
  count  = terraform.workspace == "prod" ? 1 : 0
  source = "./modules/acm"
  domain_name = "robmclaughl.in"
  subject_alternative_names = ["www.robmclaughl.in", "*.robmclaughl.in"]
  # Reference route53 module using count index
  zone_id = module.route53[0].zone_id
  
  providers = {
    aws           = aws # Explicitly pass the default provider
    aws.us_east_1 = aws.us_east_1
  }
}

# WAF Web ACL for CloudFront (Only create in prod)
resource "aws_wafv2_web_acl" "main_waf_acl" {
  count       = terraform.workspace == "prod" ? 1 : 0
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

# CloudFront Distribution (This might need adjustment depending on whether previews need CF)
# Assuming for now that CloudFront is also primarily for prod, but adjust if needed.
# If previews need CF, we might need separate distributions or more complex logic.
module "cloudfront" {
  count = terraform.workspace == "prod" ? 1 : 0 # Make CloudFront conditional too
  source = "./modules/cloudfront"
  bucket_name = module.website_bucket.bucket_name
  bucket_regional_domain_name = module.website_bucket.bucket_regional_domain_name
  bucket_arn = module.website_bucket.bucket_arn
  # Reference conditional resources using count index
  acm_certificate_arn = module.acm[0].certificate_arn
  domain_names = ["robmclaughl.in", "www.robmclaughl.in"]
  logs_bucket = module.logs_bucket.bucket_name
  logs_prefix = "cloudfront-logs/"
  index_rewrite_paths = ["/branch/*"] # Add list of paths requiring index rewrite
  # Reference conditional resources using count index
  waf_web_acl_arn = aws_wafv2_web_acl.main_waf_acl[0].arn # Pass the WAF ARN

  # Ensure CloudFront waits for the WAF ACL
  # Reference conditional resources using count index
  depends_on = [aws_wafv2_web_acl.main_waf_acl[0]]
}

# S3 Bucket Policy for CloudFront OAC (Conditional based on CloudFront existing)
data "aws_iam_policy_document" "s3_policy_oac" {
  count = terraform.workspace == "prod" ? 1 : 0 # Make conditional
  statement {
    sid       = "AllowCloudFrontOAC"
    actions   = ["s3:GetObject"]
    resources = ["${module.website_bucket.bucket_arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      # Reference conditional resource using count index
      values   = [module.cloudfront[0].distribution_arn] # Use CloudFront module output
    }
  }
}

resource "aws_s3_bucket_policy" "bucket_policy_oac" {
  count  = terraform.workspace == "prod" ? 1 : 0 # Make conditional
  bucket = module.website_bucket.bucket_name # Target the website bucket
  policy = data.aws_iam_policy_document.s3_policy_oac[0].json

  depends_on = [
    module.website_bucket,
    # Reference conditional resource using count index
    module.cloudfront[0] # Ensure CloudFront distribution exists before applying policy
  ]
}

# Route53 configuration (Only create in prod)
module "route53" {
  count  = terraform.workspace == "prod" ? 1 : 0
  source = "./modules/route53"
  domain_name = "robmclaughl.in"
  zone_id     = "Z2PPIVE6CKK74T" # Pass the correct Zone ID directly (without trailing X)
  # Reference conditional resource using count index
  cloudfront_distribution_domain_name = module.cloudfront[0].distribution_domain_name
  cloudfront_distribution_zone_id = module.cloudfront[0].distribution_zone_id
}

# IAM Role for GitHub Actions (Only create in prod)
module "github_actions" {
  count  = terraform.workspace == "prod" ? 1 : 0
  source = "./modules/iam"
  bucket_name = module.website_bucket.bucket_name
  bucket_arn = module.website_bucket.bucket_arn
  # Reference conditional resource using count index
  cloudfront_distribution_arn = module.cloudfront[0].distribution_arn
  cloudfront_distribution_id = module.cloudfront[0].distribution_id
  github_owner = "robmclaughliniv" # Update with your actual GitHub username
  github_repo = "robmclaughl.in" # Update with your actual repository name
  
  depends_on = [
    module.website_bucket,
    module.logs_bucket,
    # Reference conditional resources using count index
    module.cloudfront[0],
    aws_s3_bucket_policy.bucket_policy_oac[0] # Depend on the newly added bucket policy
  ]
}

# Output values (Conditional)
output "website_bucket_name" {
  description = "Name of the S3 bucket hosting the website content"
  value       = module.website_bucket.bucket_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = terraform.workspace == "prod" ? module.cloudfront[0].distribution_id : "N/A (Not Prod)"
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = terraform.workspace == "prod" ? module.cloudfront[0].distribution_domain_name : "N/A (Not Prod)"
}

output "website_url" {
  description = "URL of the website"
  value       = "https://robmclaughl.in"
}

# Add WAF ACL ARN output
output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL associated with CloudFront"
  value       = terraform.workspace == "prod" ? aws_wafv2_web_acl.main_waf_acl[0].arn : "N/A (Not Prod)"
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions"
  value       = terraform.workspace == "prod" ? module.github_actions[0].role_arn : "N/A (Not Prod)"
}

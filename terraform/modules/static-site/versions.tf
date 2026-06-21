# Provider requirements for the static-site module.
#
# This module needs two AWS provider configurations:
#   - aws            : the regional provider where the S3 bucket, Lambda, and
#                      API Gateway live (e.g. us-west-2).
#   - aws.us_east_1  : a us-east-1 provider used ONLY to read shared CloudFront
#                      primitives that must live in us-east-1 (the ACM wildcard
#                      certificate and the CLOUDFRONT-scoped WAF Web ACL).
#
# The consuming repo must pass both via the `providers` block.
terraform {
  required_version = ">= 1.3.0"

  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 5.0.0"
      configuration_aliases = [aws, aws.us_east_1]
    }
  }
}

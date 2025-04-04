# Terraform Configuration for robmclaughl.in

This directory contains the Terraform configuration for deploying the robmclaughl.in website on AWS.

## Infrastructure Components

- **S3 Bucket**: Stores the static website files (with public access blocked)
- **CloudFront Distribution**: CDN for serving the website with HTTPS, security headers, and access logging
- **ACM Certificate**: SSL/TLS certificate for HTTPS
- **Route53 Records**: DNS configuration for the domain
- **IAM Role for GitHub Actions**: Allows CI/CD pipeline to deploy the website with least privilege permissions
- **S3 Backend**: Stores Terraform state with DynamoDB locking

## Prerequisites

- AWS account with appropriate permissions
- Terraform 1.0.0 or later
- AWS CLI configured with access credentials
- Domain registered in Route53

## Usage

1. Initialize Terraform with the S3 backend:
   ```
   terraform init
   ```

   Note: The S3 backend bucket and DynamoDB table must exist before running this command.

2. Preview the changes:
   ```
   terraform plan
   ```

3. Apply the changes:
   ```
   terraform apply
   ```

4. To destroy the infrastructure:
   ```
   terraform destroy
   ```

## Important Notes

- The S3 bucket is configured with `prevent_destroy = true` to prevent accidental deletion
- The CloudFront distribution uses Origin Access Control (OAC) to secure the S3 bucket
- CloudFront is configured with a Response Headers Policy for security headers (HSTS, CSP, etc.)
- CloudFront access logging is enabled to a dedicated S3 bucket
- The ACM certificate must be in the us-east-1 region for use with CloudFront
- The IAM role for GitHub Actions follows the principle of least privilege
- Terraform state is stored in an S3 backend with DynamoDB locking for secure and reliable state management

## Outputs

- `website_bucket_name`: Name of the S3 bucket
- `cloudfront_distribution_id`: ID of the CloudFront distribution
- `cloudfront_domain_name`: Domain name of the CloudFront distribution
- `website_url`: URL of the website
- `github_actions_role_arn`: ARN of the IAM role for GitHub Actions

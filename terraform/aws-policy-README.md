# AWS IAM Policies for GitHub Actions Deployment

These policy documents implement the principle of least privilege for the GitHub Actions workflow that deploys the robmclaughl.in website to AWS S3 and invalidates the CloudFront distribution.

## Files

1. `aws-deploy-policy.json` - The IAM policy that grants minimal permissions needed for deployment
2. `aws-deploy-trust-policy.json` - The trust policy that allows GitHub Actions to assume the role

## Installation Instructions

Before using these policies, you need to replace placeholder values:

1. Replace `{AWS_ACCOUNT_ID}` with your AWS account ID
2. Replace `{CLOUDFRONT_DISTRIBUTION_ID}` with your CloudFront distribution ID
3. Replace `{GITHUB_USERNAME}` with your GitHub username or organization
4. Replace `{GITHUB_REPO}` with your GitHub repository name

### Creating the IAM Role with AWS CLI

```bash
# 1. Create the IAM role with the trust policy
aws iam create-role \
  --role-name github-actions-deploy-role \
  --assume-role-policy-document file://aws-deploy-trust-policy.json

# 2. Create the deployment policy
aws iam create-policy \
  --policy-name github-actions-deploy-policy \
  --policy-document file://aws-deploy-policy.json

# 3. Attach the policy to the role
aws iam attach-role-policy \
  --role-name github-actions-deploy-role \
  --policy-arn arn:aws:iam::{AWS_ACCOUNT_ID}:policy/github-actions-deploy-policy

# 4. Get the role ARN to use in GitHub
aws iam get-role --role-name github-actions-deploy-role --query Role.Arn --output text
```

### Setting up GitHub Repository

1. Add the role ARN as a secret in your GitHub repository:
   - Go to your repository settings
   - Navigate to Secrets and Variables > Actions
   - Create a new secret named `AWS_DEPLOY_ROLE_ARN` with the value of your IAM role ARN

## Permissions Explanation

This policy grants only the minimal permissions needed:

### S3 Permissions
- `s3:ListBucket` - Allows listing objects in the bucket (needed for sync operation)
- `s3:PutObject` - Allows uploading files to the bucket
- `s3:GetObject` - Allows reading files from the bucket
- `s3:DeleteObject` - Allows deleting files (needed for sync --delete)
- `s3:PutObjectAcl` - Allows setting ACLs (needed for --acl private flag)

### CloudFront Permissions
- `cloudfront:CreateInvalidation` - Allows creating cache invalidations
- `cloudfront:GetInvalidation` - Allows checking invalidation status

## Security Benefits

1. **Resource-specific permissions**: All permissions are scoped to specific S3 bucket and CloudFront distribution
2. **Repository-specific trust**: Only the specified GitHub repository can assume the role
3. **Minimal permissions**: Only the exact permissions needed for deployment are granted
4. **No permanent credentials**: Uses OIDC for short-lived access tokens instead of long-lived access keys
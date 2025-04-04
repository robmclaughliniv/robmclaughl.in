# IAM Role for GitHub Actions OIDC integration
resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy-role"
  
  # Trust policy that allows GitHub Actions to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          },
          StringLike = {
            # Restrict to specific repository
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_owner}/${var.github_repo}:*"
          }
        }
      }
    ]
  })
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Policy document for S3 permissions
data "aws_iam_policy_document" "s3_deploy" {
  # Allow listing the specific S3 bucket
  statement {
    sid    = "S3BucketListPermission"
    effect = "Allow"
    actions = [
      "s3:ListBucket"
    ]
    resources = [var.bucket_arn]
  }
  
  # Allow uploading, downloading, and deleting objects in the bucket
  statement {
    sid    = "S3ObjectPermissions"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject", # Retaining GetObject for potential sync checks, can be removed if sync doesn't need it
      "s3:DeleteObject"
    ]
    resources = ["${var.bucket_arn}/*"]
  }
}

# Policy document for CloudFront invalidation permissions
data "aws_iam_policy_document" "cloudfront_invalidation" {
  # Allow creating and checking invalidations for the specific CloudFront distribution
  statement {
    sid    = "CloudFrontInvalidationPermissions"
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation"
    ]
    resources = [var.cloudfront_distribution_arn]
  }
}

# Create the S3 IAM policy
resource "aws_iam_policy" "s3_deploy" {
  name        = "github-actions-s3-deploy-policy"
  description = "Policy for GitHub Actions to deploy to S3"
  policy      = data.aws_iam_policy_document.s3_deploy.json
}

# Create the CloudFront IAM policy
resource "aws_iam_policy" "cloudfront_invalidation" {
  name        = "github-actions-cloudfront-invalidation-policy"
  description = "Policy for GitHub Actions to invalidate CloudFront"
  policy      = data.aws_iam_policy_document.cloudfront_invalidation.json
}

# Attach the S3 policy to the role
resource "aws_iam_role_policy_attachment" "s3_deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.s3_deploy.arn
}

# Attach the CloudFront policy to the role
resource "aws_iam_role_policy_attachment" "cloudfront_invalidation" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.cloudfront_invalidation.arn
}

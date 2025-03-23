# IAM Role for GitHub Actions OIDC integration
resource "aws_iam_role" "github_actions" {
  name = "github-actions-role"
  
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
            "token.actions.githubusercontent.com:sub" = "repo:*:*" # This should be restricted to your specific repository
          }
        }
      }
    ]
  })
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Policy document for S3 and CloudFront permissions
data "aws_iam_policy_document" "deploy" {
  # Allow listing the S3 bucket
  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket"
    ]
    resources = [var.bucket_arn]
  }
  
  # Allow modifying S3 objects
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject"
    ]
    resources = ["${var.bucket_arn}/*"]
  }
  
  # Allow CloudFront invalidations
  statement {
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:ListInvalidations"
    ]
    resources = [var.cloudfront_distribution_arn]
  }
}

# Create the IAM policy
resource "aws_iam_policy" "deploy" {
  name        = "github-actions-deploy-policy"
  description = "Policy for GitHub Actions to deploy to S3 and invalidate CloudFront"
  policy      = data.aws_iam_policy_document.deploy.json
}

# Attach the policy to the role
resource "aws_iam_role_policy_attachment" "deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.deploy.arn
}

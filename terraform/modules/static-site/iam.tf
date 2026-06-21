# GitHub Actions OIDC deploy role, scoped to THIS app's bucket + distribution
# (and, when enabled, its Lambda). Reuses the account's existing GitHub OIDC
# provider — it is never created here.

resource "aws_iam_role" "gha" {
  name = "${local.name_prefix}-gha-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = local.oidc_subjects
          }
        }
      }
    ]
  })

  tags = local.tags
}

# --- S3 content deploy ---
data "aws_iam_policy_document" "s3_deploy" {
  statement {
    sid       = "S3BucketList"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.website.arn]
  }

  statement {
    sid       = "S3ObjectWrite"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.website.arn}/*"]
  }
}

resource "aws_iam_policy" "s3_deploy" {
  name   = "${local.name_prefix}-gha-s3-deploy"
  policy = data.aws_iam_policy_document.s3_deploy.json
  tags   = local.tags
}

resource "aws_iam_role_policy_attachment" "s3_deploy" {
  role       = aws_iam_role.gha.name
  policy_arn = aws_iam_policy.s3_deploy.arn
}

# --- CloudFront invalidation ---
data "aws_iam_policy_document" "cf_invalidation" {
  statement {
    sid       = "CloudFrontInvalidation"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = [aws_cloudfront_distribution.website.arn]
  }
}

resource "aws_iam_policy" "cf_invalidation" {
  name   = "${local.name_prefix}-gha-cf-invalidation"
  policy = data.aws_iam_policy_document.cf_invalidation.json
  tags   = local.tags
}

resource "aws_iam_role_policy_attachment" "cf_invalidation" {
  role       = aws_iam_role.gha.name
  policy_arn = aws_iam_policy.cf_invalidation.arn
}

# --- Lambda code deploy (only when the API add-on is enabled) ---
data "aws_iam_policy_document" "lambda_deploy" {
  count = var.enable_api ? 1 : 0

  statement {
    sid       = "LambdaCodeDeploy"
    effect    = "Allow"
    actions   = ["lambda:UpdateFunctionCode", "lambda:GetFunction", "lambda:UpdateFunctionConfiguration"]
    resources = [aws_lambda_function.api[0].arn]
  }
}

resource "aws_iam_policy" "lambda_deploy" {
  count  = var.enable_api ? 1 : 0
  name   = "${local.name_prefix}-gha-lambda-deploy"
  policy = data.aws_iam_policy_document.lambda_deploy[0].json
  tags   = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_deploy" {
  count      = var.enable_api ? 1 : 0
  role       = aws_iam_role.gha.name
  policy_arn = aws_iam_policy.lambda_deploy[0].arn
}

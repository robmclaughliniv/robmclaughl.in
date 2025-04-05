# Try to get the bucket if it exists
data "aws_s3_bucket" "existing" {
  count  = var.cloudfront_distribution_arn == "" ? 0 : 1
  bucket = var.bucket_name
}

locals {
  # Create bucket in Phase 1, don't create in Phase 3
  create_bucket = var.cloudfront_distribution_arn == ""
  # In Phase 1, use the created bucket. In Phase 3, use the data source
  bucket_id = var.cloudfront_distribution_arn == "" ? aws_s3_bucket.website[0].id : data.aws_s3_bucket.existing[0].id
  bucket_arn = var.cloudfront_distribution_arn == "" ? aws_s3_bucket.website[0].arn : data.aws_s3_bucket.existing[0].arn
}

# S3 bucket for the website content
resource "aws_s3_bucket" "website" {
  # Only create the bucket if it doesn't exist
  count  = local.create_bucket ? 1 : 0
  bucket = var.bucket_name

  # Prevent accidental deletion of this bucket
  lifecycle {
    prevent_destroy = true
  }
}

# Configure object ownership for the bucket
resource "aws_s3_bucket_ownership_controls" "website" {
  count  = local.create_bucket ? 1 : 0
  bucket = local.bucket_id

  # For regular website bucket, keep ACLs disabled (Bucket owner enforced)
  # For logs bucket, we'll set this differently
  rule {
    object_ownership = var.is_logs_bucket ? "BucketOwnerPreferred" : "BucketOwnerEnforced"
  }
}

# Grant CloudFront logs delivery permissions via ACL (only for logs bucket)
resource "aws_s3_bucket_acl" "website" {
  count  = local.create_bucket && var.is_logs_bucket ? 1 : 0
  bucket = local.bucket_id
  
  # This depends on the ownership controls being set first
  depends_on = [aws_s3_bucket_ownership_controls.website]
  
  # Grant CloudFront logs delivery service write permissions
  access_control_policy {
    grant {
      grantee {
        id   = "c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0"
        type = "CanonicalUser"
      }
      permission = "FULL_CONTROL"
    }
    
    grant {
      grantee {
        type = "Group"
        uri  = "http://acs.amazonaws.com/groups/s3/LogDelivery"
      }
      permission = "WRITE"
    }
    
    grant {
      grantee {
        type = "Group"
        uri  = "http://acs.amazonaws.com/groups/s3/LogDelivery"
      }
      permission = "READ_ACP"
    }
    
    owner {
      id = data.aws_canonical_user_id.current.id
    }
  }
}

# Get the current account's canonical user ID for ACL configuration
data "aws_canonical_user_id" "current" {}


# Enable versioning on the bucket
resource "aws_s3_bucket_versioning" "website" {
  count  = local.create_bucket ? 1 : 0
  bucket = local.bucket_id
  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access to the bucket
resource "aws_s3_bucket_public_access_block" "website" {
  count  = local.create_bucket ? 1 : 0
  bucket = local.bucket_id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable default encryption on the bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "website" {
  count  = local.create_bucket ? 1 : 0
  bucket = local.bucket_id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Policy document that allows CloudFront OAC to access the S3 bucket
data "aws_iam_policy_document" "s3_policy_oac" {
  count = var.cloudfront_distribution_arn != "" ? 1 : 0
  
  statement {
    sid       = "AllowCloudFrontOAC"
    actions   = ["s3:GetObject"]
    resources = ["${local.bucket_arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [var.cloudfront_distribution_arn]
    }
  }
}

# Attach the policy to the S3 bucket
resource "aws_s3_bucket_policy" "bucket_policy_oac" {
  count  = var.cloudfront_distribution_arn != "" ? 1 : 0
  bucket = local.bucket_id
  policy = data.aws_iam_policy_document.s3_policy_oac[0].json
}

# Add lifecycle configuration using the dedicated resource
resource "aws_s3_bucket_lifecycle_configuration" "website_lifecycle" {
  # Apply this configuration regardless of whether the bucket was created or already existed
  bucket = local.bucket_id 

  rule {
    id      = "ExpirePreviewBranches"
    status  = "Enabled"

    filter {
      prefix = "branch/" # Apply to objects under the branch/ prefix
    }

    expiration {
      days = 30 # Expire objects after 30 days
    }

    # Recommended for buckets with versioning to clean up non-current versions
    noncurrent_version_expiration {
      noncurrent_days = 30 # Expire non-current versions after 30 days
    }

    # Recommended to clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7 
    }
  }

  # Add depends_on if the bucket resource is conditionally created
  depends_on = [aws_s3_bucket.website]
}

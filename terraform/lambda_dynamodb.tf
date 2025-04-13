# main.tf

# Use terraform.workspace to differentiate environments (e.g., 'default', 'dev', 'prod')
# You can switch workspaces using `terraform workspace select <name>`
locals {
  environment = terraform.workspace == "default" ? "dev" : terraform.workspace # Use 'dev' for default workspace
  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
  resource_prefix = "${var.project_name}-${local.environment}"
}

# ------------------------------------------------------------
# DynamoDB Table
# ------------------------------------------------------------
resource "aws_dynamodb_table" "main_table" {
  name         = local.resource_prefix # e.g., robmclaughlin-dev or robmclaughlin-prod
  billing_mode = "PAY_PER_REQUEST"     # On-demand capacity

  # Define the primary key attribute
  attribute {
    name = var.dynamodb_primary_key
    type = var.dynamodb_primary_key_type
  }

  # Define the hash key (partition key) using the attribute above
  hash_key = var.dynamodb_primary_key

  # Enable point-in-time recovery for production, optional for dev
  point_in_time_recovery {
    enabled = local.environment == "prod"
  }

  # Enable server-side encryption (recommended)
  server_side_encryption {
    enabled = true
  }

  tags = local.common_tags
}

# ------------------------------------------------------------
# IAM Role and Policy for Lambda
# ------------------------------------------------------------

# IAM Role that the Lambda function will assume
resource "aws_iam_role" "lambda_exec_role" {
  name = "${local.resource_prefix}-lambda-exec-role"

  # Policy allowing Lambda service to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

# IAM Policy granting write access to the specific DynamoDB table
data "aws_iam_policy_document" "dynamodb_write_policy_doc" {
  statement {
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem",
      "dynamodb:BatchWriteItem"
      # Add other actions like Query, Scan if needed
    ]
    effect = "Allow"
    # Restrict policy to the specific table created above
    resources = [aws_dynamodb_table.main_table.arn]
  }
}

resource "aws_iam_policy" "dynamodb_write_policy" {
  name        = "${local.resource_prefix}-dynamodb-write-policy"
  description = "IAM policy allowing Lambda to write to the ${aws_dynamodb_table.main_table.name} DynamoDB table"
  policy      = data.aws_iam_policy_document.dynamodb_write_policy_doc.json
}

# Attach the DynamoDB write policy to the Lambda execution role
resource "aws_iam_role_policy_attachment" "dynamodb_write_attach" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.dynamodb_write_policy.arn
}

# Attach the basic Lambda execution policy (for CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution_attach" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ------------------------------------------------------------
# Lambda Function Deployment Package
# ------------------------------------------------------------

# Data source to create a zip archive of the Lambda code
# Assumes build output is in ../dist relative to lambda_src/package.json location
# and the final zip should be placed in ../build/lambda_function.zip
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda_src/dist" # Adjusted path relative to terraform dir
  output_path = "${path.module}/../build/lambda_function.zip" # Adjusted path relative to terraform dir
}

# NOTE: Terraform doesn't run the build process itself.
# You must run `pnpm run package` (or `npm run package`) in `lambda_src` *before* `terraform apply`.

# ------------------------------------------------------------
# Lambda Function Resource
# ------------------------------------------------------------
resource "aws_lambda_function" "main_lambda" {
  function_name = "${local.resource_prefix}-function"
  role          = aws_iam_role.lambda_exec_role.arn

  # Reference the zip file created by the archive_file data source
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256 # Ensures updates on code change

  handler = var.lambda_handler # e.g., index.handler
  runtime = var.lambda_runtime # e.g., nodejs20.x

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  # Pass the DynamoDB table name to the Lambda via environment variables
  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main_table.name
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1" # Recommended for Node.js performance
    }
  }

  tags = local.common_tags

  # Explicit dependency on the policy attachments to ensure role has permissions before function creation
  depends_on = [
    aws_iam_role_policy_attachment.dynamodb_write_attach,
    aws_iam_role_policy_attachment.lambda_basic_execution_attach,
  ]
}

# Optional: CloudWatch Log Group for the Lambda function
resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.main_lambda.function_name}"
  retention_in_days = local.environment == "prod" ? 30 : 7 # Keep logs longer for prod

  tags = local.common_tags
} 
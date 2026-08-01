# Optional same-origin API: a Lambda fronted by an HTTP API Gateway, reached at
# /api/* through the CloudFront distribution. All resources are gated on
# var.enable_api so the module stays purely static when the add-on is off.

# Optional DynamoDB table.
resource "aws_dynamodb_table" "api" {
  count        = var.enable_api && var.enable_dynamodb ? 1 : 0
  name         = local.name_prefix
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = var.dynamodb_primary_key

  attribute {
    name = var.dynamodb_primary_key
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = local.tags
}

# Lambda execution role.
resource "aws_iam_role" "lambda_exec" {
  count = var.enable_api ? 1 : 0
  name  = "${local.name_prefix}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  count      = var.enable_api ? 1 : 0
  role       = aws_iam_role.lambda_exec[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_dynamodb" {
  count = var.enable_api && var.enable_dynamodb ? 1 : 0

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:DeleteItem",
      "dynamodb:BatchWriteItem",
    ]
    resources = [aws_dynamodb_table.api[0].arn]
  }
}

resource "aws_iam_policy" "lambda_dynamodb" {
  count  = var.enable_api && var.enable_dynamodb ? 1 : 0
  name   = "${local.name_prefix}-lambda-dynamodb-write"
  policy = data.aws_iam_policy_document.lambda_dynamodb[0].json
  tags   = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  count      = var.enable_api && var.enable_dynamodb ? 1 : 0
  role       = aws_iam_role.lambda_exec[0].name
  policy_arn = aws_iam_policy.lambda_dynamodb[0].arn
}

# Placeholder deployment package. Terraform stands the function up with a
# trivial handler; CI ships real code via `lambda update-function-code`, so we
# ignore code drift after creation.
data "archive_file" "lambda_placeholder" {
  count       = var.enable_api ? 1 : 0
  type        = "zip"
  output_path = "${path.module}/build/lambda_placeholder.zip"

  source {
    filename = "index.mjs"
    content  = <<-EOT
      export const handler = async () => ({
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "placeholder — deploy real code via CI" }),
      });
    EOT
  }
}

resource "aws_lambda_function" "api" {
  count            = var.enable_api ? 1 : 0
  function_name    = "${local.name_prefix}-api"
  role             = aws_iam_role.lambda_exec[0].arn
  filename         = data.archive_file.lambda_placeholder[0].output_path
  source_code_hash = data.archive_file.lambda_placeholder[0].output_base64sha256
  handler          = var.lambda_handler
  runtime          = var.lambda_runtime
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  environment {
    variables = merge(
      var.enable_dynamodb ? { DYNAMODB_TABLE_NAME = aws_dynamodb_table.api[0].name } : {},
      { AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1" },
      var.lambda_environment,
    )
  }

  tags = local.tags

  # Code is owned by CI after the initial create.
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_basic]
}

resource "aws_cloudwatch_log_group" "lambda" {
  count             = var.enable_api ? 1 : 0
  name              = "/aws/lambda/${aws_lambda_function.api[0].function_name}"
  retention_in_days = 30
  tags              = local.tags
}

# HTTP API. No CORS config needed: requests are same-origin via CloudFront.
resource "aws_apigatewayv2_api" "api" {
  count         = var.enable_api ? 1 : 0
  name          = "${local.name_prefix}-http-api"
  protocol_type = "HTTP"
  description   = "HTTP API for ${local.fqdn} (/api/*)"
  tags          = local.tags
}

resource "aws_apigatewayv2_integration" "api" {
  count                  = var.enable_api ? 1 : 0
  api_id                 = aws_apigatewayv2_api.api[0].id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.api[0].invoke_arn
  payload_format_version = "2.0"
}

# Routes are defined WITH the /api prefix so CloudFront can forward /api/*
# unchanged — no edge path rewriting required.
resource "aws_apigatewayv2_route" "api_proxy" {
  count     = var.enable_api ? 1 : 0
  api_id    = aws_apigatewayv2_api.api[0].id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.api[0].id}"
}

resource "aws_apigatewayv2_stage" "api" {
  count       = var.enable_api ? 1 : 0
  api_id      = aws_apigatewayv2_api.api[0].id
  name        = "$default"
  auto_deploy = true
  tags        = local.tags
}

resource "aws_lambda_permission" "api_gw" {
  count         = var.enable_api ? 1 : 0
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api[0].execution_arn}/*/*"
}

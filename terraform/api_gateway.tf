# Terraform configuration for API Gateway triggering the Lambda function

# 1. Create the HTTP API Gateway
resource "aws_apigatewayv2_api" "main_api" {
  name          = "robmclaughlin-${local.environment}-http-api"
  protocol_type = "HTTP"
  description   = "HTTP API Gateway for robmclaughl.in"

  cors_configuration {
    allow_origins = ["https://robmclaughl.in", "https://www.robmclaughl.in"] # TODO: Consider adding localhost for local dev testing
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    expose_headers = []
    max_age        = 300
  }

  tags = local.common_tags # Use tags defined in lambda_dynamodb.tf
}

# 2. Create the Lambda Integration
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id             = aws_apigatewayv2_api.main_api.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.main_lambda.invoke_arn
  payload_format_version = "2.0"
}

# 3. Define the Route for POST /contact
resource "aws_apigatewayv2_route" "contact_post_route" {
  api_id    = aws_apigatewayv2_api.main_api.id
  route_key = "POST /contact"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# 4. Create a Default Stage with Auto-Deploy
resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.main_api.id
  name        = "$default"
  auto_deploy = true

  tags = local.common_tags # Use tags defined in lambda_dynamodb.tf
}

# 5. Grant API Gateway permission to invoke the Lambda function
resource "aws_lambda_permission" "api_gw_invoke_lambda" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  # Source ARN restricts permission to this specific API Gateway route
  source_arn = "${aws_apigatewayv2_api.main_api.execution_arn}/*/${aws_apigatewayv2_route.contact_post_route.route_key}"
}

# 6. Output the API endpoint URL
output "api_gateway_endpoint" {
  description = "The invoke URL for the API Gateway endpoint"
  value       = aws_apigatewayv2_api.main_api.api_endpoint
} 
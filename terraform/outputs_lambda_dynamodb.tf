# outputs.tf

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main_table.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.main_table.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.main_lambda.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.main_lambda.arn
}

output "lambda_iam_role_name" {
  description = "Name of the IAM role assigned to the Lambda function"
  value       = aws_iam_role.lambda_exec_role.name
}

output "lambda_iam_role_arn" {
  description = "ARN of the IAM role assigned to the Lambda function"
  value       = aws_iam_role.lambda_exec_role.arn
}

output "lambda_log_group_name" {
  description = "Name of the CloudWatch Log Group for the Lambda function"
  value       = aws_cloudwatch_log_group.lambda_log_group.name
} 
# variables.tf

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1" # Or your preferred region
}

variable "project_name" {
  description = "Base name for resources"
  type        = string
  default     = "robmclaughlin"
}

variable "lambda_runtime" {
  description = "Node.js runtime for the Lambda function"
  type        = string
  default     = "nodejs20.x" # Use a current LTS Node.js runtime
}

variable "lambda_handler" {
  description = "Handler function within the Lambda code"
  type        = string
  default     = "index.handler" # Assumes dist/index.js with exported handler
}

variable "lambda_memory_size" {
    description = "Memory allocation for the Lambda function in MB"
    type        = number
    default     = 128
}

variable "lambda_timeout" {
    description = "Timeout for the Lambda function in seconds"
    type        = number
    default     = 10
}

variable "dynamodb_primary_key" {
    description = "The name of the primary key attribute for the DynamoDB table"
    type        = string
    default     = "id"
}

variable "dynamodb_primary_key_type" {
    description = "The type of the primary key attribute (S = String, N = Number, B = Binary)"
    type        = string
    default     = "S" # String
} 
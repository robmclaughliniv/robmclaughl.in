# Terraform version constraints
terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source = "hashicorp/aws"
      # 4.64.0 added remove_headers_config on response headers policies.
      version = ">= 4.64.0"
    }
  }
}

# Standalone root so `terraform test` can plan the shared static-site module
# without becoming part of the production configuration (that module requires
# an aliased us-east-1 provider). Providers here are mocked by errors.tftest.hcl.

terraform {
  required_version = ">= 1.8.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

variable "app_name" {
  type = string
}

variable "subdomain" {
  type = string
}

variable "repo" {
  type = string
}

variable "spa_mode" {
  type    = bool
  default = false
}

variable "csp_override" {
  type    = string
  default = null
}

module "site" {
  source = "../../modules/static-site"

  app_name     = var.app_name
  subdomain    = var.subdomain
  repo         = var.repo
  spa_mode     = var.spa_mode
  csp_override = var.csp_override
  enable_waf   = false
  enable_api   = false
  logs_bucket  = ""

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}

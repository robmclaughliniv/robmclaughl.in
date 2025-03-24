variable "domain_name" {
  description = "Domain name for the website"
  type        = string
}

variable "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  type        = string
}

variable "cloudfront_distribution_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  type        = string
}

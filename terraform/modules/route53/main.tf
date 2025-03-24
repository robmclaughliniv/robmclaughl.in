# Get the existing Route53 hosted zone for the domain
data "aws_route53_zone" "zone" {
  name = var.domain_name
  # If the zone is private, set this to true
  private_zone = false
}

# Create empty placeholder resources for the existing DNS records
# This allows Terraform to continue without errors while still recognizing
# that these records conceptually exist in our infrastructure
resource "null_resource" "apex_record_exists" {
  # This resource does nothing but exist so we can reference it
}

resource "null_resource" "www_record_exists" {
  # This resource does nothing but exist so we can reference it
}

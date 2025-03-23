output "zone_id" {
  description = "ID of the Route53 hosted zone"
  value       = data.aws_route53_zone.zone.zone_id
}

output "name_servers" {
  description = "Name servers for the Route53 hosted zone"
  value       = data.aws_route53_zone.zone.name_servers
}

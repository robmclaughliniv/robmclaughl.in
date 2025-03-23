 Read my documentation. I have finished creating and exporting a prototype from v0. The basic ui is done and I have tweaked a few things. It is time to build infrastructure to deploy everything.

We need to deploy the site on AWS. **Generate a Terraform configuration** that sets up the following AWS resources for our application (robmclaughl.in):

1. **S3 Bucket** (`robmclaughl.in-website-bucket`): This will store the static files for the website.
   - It should have server-side encryption enabled (SSE-S3 by default).
   - Block all public access (no public ACLs). We will use CloudFront to serve content, so no direct public access.
   - (Optional but nice) Enable versioning on the bucket, so we have history of deployments (not strictly needed, but can be useful).
   - We will **not** enable the static website hosting (because that opens it to public). Instead, CloudFront will retrieve objects directly.

2. **CloudFront Distribution**: This will serve content from the S3 bucket at our custom domain.
   - Use an Origin Access Identity or Origin Access Control so that CloudFront can access the S3 bucket privately. Create an OAI resource and attach it to the distribution, and set the S3 bucket policy to allow that OAI to read objects.
   - The origin should point to the S3 bucket (by its regional website endpoint or S3 domain).
   - Configure default root object as `index.html`.
   - Enable HTTPs only. Redirect HTTP to HTTPS.
   - Attach a custom domain alias: `robmclaughl.in` (and `www.robmclaughl.in` if we want both).
   - Attach an ACM certificate for the domain (see next item).
   - Cache policy: use the *Managed-CachingOptimized* policy or create a policy to cache static content. Make sure query strings, etc., are handled (for a static site, can cache everything long).
   - Enable logging (optional: to an S3 bucket for logs).
   - PriceClass can be left default or set to `PriceClass_100` (to use cheaper regions if cost is a concern).
   - Default behavior should allow GET/HEAD and perhaps OPTIONS, no need for POST.

3. **ACM Certificate** (in us-east-1 region): for `robmclaughl.in` (and maybe a SAN for `www.robmclaughl.in`).
   - Use DNS validation. We have Route53, so Terraform can add the validation CNAME in the Route53 zone.
   - Wait for validation (Terraform can handle the async via `aws_acm_certificate_validation` resource).
   - The certificate ARN will be used in the CloudFront distribution.

4. **Route53 Hosted Zone and Records**: 
   - If a hosted zone for `robmclaughl.in` doesn’t exist, create one (assuming the domain is already registered and pointing to Route53).
   - Create an A record for `robmclaughl.in` that is an **Alias** to the CloudFront distribution. In Terraform, this uses the `aws_route53_record` with `alias` configuration pointing to the CloudFront domain and zone ID.
   - (If including www) Create another record for `www.robmclaughl.in` as CNAME or alias to the CloudFront as well, or alternatively as a redirect to the root domain (that would require an S3 redirect bucket or CloudFront function – can skip for now).
   
5. **IAM Role for Deployment (OIDC)**:
   - Create an IAM role that our GitHub Actions can assume via OpenID Connect.
   - The role's trust policy should allow the GitHub OIDC provider (`token.actions.githubusercontent.com`) with condition that the repository is Rob’s repo.
   - Attach a policy to this role allowing necessary actions: specifically, `s3:PutObject`, `s3:ListBucket` on the website bucket, and `cloudfront:CreateInvalidation` on the CloudFront distribution. (Also maybe `s3:DeleteObject` for removing files).
   - Least privilege: the policy should only allow those actions on the resources (the bucket ARN and the CloudFront distribution ID ARN).
   
Organize the Terraform into logical blocks/files if needed (one for S3, one for CloudFront, etc.). Use Terraform best practices and proper resource naming.

Provide the Terraform code (preferably in HashiCorp HCL syntax) for all the above. Make sure to include any necessary providers (AWS provider configuration) and to reference resources appropriately (e.g., Route53 zone id data source if needed, etc.). Also include output values for things like the CloudFront domain name, the S3 bucket name (for reference), etc.

We intend to run this Terraform config to set up everything without using the AWS console at all.
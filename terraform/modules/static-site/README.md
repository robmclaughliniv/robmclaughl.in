# `static-site` Terraform module

Self-contained production hosting for a static / client-side SPA front-end on
the shared `robmclaughl.in` infrastructure, with an optional same-origin
`/api/*` add-on (Lambda + HTTP API Gateway).

One module call gives you: a private S3 content bucket, a CloudFront
distribution (OAC, shared security headers, directory-rewrite function, WAF),
Route 53 alias records, and a least-privilege GitHub Actions OIDC deploy role —
all wired together.

## What it owns vs. what it reuses

**Created per app** (namespaced by FQDN, so apps never collide): S3 bucket +
policy, CloudFront distribution + OAC + function, Route 53 records, the GitHub
Actions deploy role/policies, and (optionally) the Lambda + API Gateway +
DynamoDB.

**Looked up read-only — never created or mutated**: the Route 53 hosted zone,
the `*.robmclaughl.in` ACM certificate (us-east-1), the shared CLOUDFRONT WAF
Web ACL (us-east-1), and the shared response-headers policy. These are owned by
the root `robmclaughl.in` infrastructure.

## Providers

The module requires two provider configurations. `aws.us_east_1` is used only
to read the cert and WAF (both must live in us-east-1):

```hcl
provider "aws" {
  region = "us-west-2"
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
```

## Usage — subdomain static site

```hcl
module "site" {
  source = "github.com/robmclaughliniv/robmclaughl.in//terraform/modules/static-site?ref=static-site-v1.0.1"

  app_name  = "craps-trainer"
  subdomain = "craps-trainer"          # => craps-trainer.robmclaughl.in
  repo      = "robmclaughliniv/craps-trainer"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}
```

## Usage — subdomain SPA with a same-origin API

```hcl
module "site" {
  source = "github.com/robmclaughliniv/robmclaughl.in//terraform/modules/static-site?ref=static-site-v1.0.1"

  app_name  = "ledger"
  subdomain = "ledger"
  repo      = "robmclaughliniv/ledger"

  spa_mode        = true               # 403/404 -> /index.html (client routing)
  enable_api      = true               # adds /api/* -> Lambda
  enable_dynamodb = true

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}
```

## Key inputs

| Variable | Default | Purpose |
| --- | --- | --- |
| `app_name` | — | App name (tags + naming fallback). |
| `subdomain` | `""` | Single label => subdomain mode. Empty => apex + www (root mode). |
| `repo` | — | `owner/name` for the OIDC trust. |
| `allowed_oidc_subjects` | `["repo:<repo>:*"]` | Tighten to specific branches for least privilege. |
| `spa_mode` | `false` | `true` for SPA fallback (403/404 -> index.html 200). |
| `csp_override` | `null` | Per-app Content-Security-Policy (otherwise reuses shared policy). |
| `enable_api` | `false` | Provision Lambda + HTTP API behind `/api/*`. |
| `enable_dynamodb` | `false` | Add a PAY_PER_REQUEST table for the API Lambda. |

See `variables.tf` for the full list.

## Key outputs (CI handoff contract)

| Output | Used by CI for |
| --- | --- |
| `role_arn` | `aws-actions/configure-aws-credentials` role. |
| `bucket_name` | `aws s3 sync` target. |
| `distribution_id` | `cloudfront create-invalidation`. |
| `lambda_function_name` | `lambda update-function-code` (when `enable_api`). |
| `site_url` | Smoke-test / display. |

## Notes

- **Subdomains must be a single label** (e.g. `app`, not `a.b`) so they are
  covered by the `*.robmclaughl.in` wildcard certificate.
- **API code is owned by CI.** Terraform creates the Lambda with a placeholder
  and ignores code drift; ship real code with `lambda update-function-code`.
- **API routes carry the `/api` prefix** (`ANY /api/{proxy+}`) so CloudFront
  forwards `/api/*` to the API origin unchanged — no edge rewriting.
- The S3 bucket has no `prevent_destroy`/`force_destroy`; empty it before
  `terraform destroy`.

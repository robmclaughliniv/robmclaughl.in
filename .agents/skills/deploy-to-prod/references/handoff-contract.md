# CI ⇄ infrastructure handoff contract

The deploy apparatus has two halves that must agree on a small set of values:

1. **Terraform** (`terraform/main.tf` → the `static-site` module) *produces*
   infrastructure and emits outputs.
2. **GitHub Actions** (`.github/workflows/*.yml`) *consumes* those values as
   repo variables to push content.

`scripts/bootstrap.sh` is the bridge: it applies Terraform, reads the outputs,
and writes them as GitHub Actions repository **variables** (not secrets — none
of these are sensitive; they're ARNs, bucket names, and IDs).

## The contract

| Terraform output | gh repo variable | Used by | For |
| --- | --- | --- | --- |
| `role_arn` | `AWS_DEPLOY_ROLE_ARN` | both workflows | OIDC `role-to-assume` |
| — (constant) | `AWS_REGION` | both workflows | `aws-region` (always `us-west-2`) |
| `bucket_name` | `S3_BUCKET` | `deploy.yml` | `aws s3 sync` target |
| `distribution_id` | `CLOUDFRONT_DISTRIBUTION_ID` | `deploy.yml` | `cloudfront create-invalidation` |
| `lambda_function_name` | `LAMBDA_FUNCTION_NAME` | `deploy-api.yml` | `lambda update-function-code` |
| `site_url` | — | humans | smoke test / display |

## Why repo variables and OIDC

- **No long-lived AWS keys.** The workflow assumes `role_arn` via GitHub's OIDC
  provider. The role's trust policy (in the module) is scoped to this repo.
- **Variables, not secrets.** ARNs/bucket names/IDs aren't secret, and using
  variables lets `bootstrap.sh` set them non-interactively and lets humans read
  them back in the GitHub UI for debugging.

## Re-running

Everything is idempotent. Re-running `bootstrap.sh` re-applies Terraform (a
no-op if nothing changed) and overwrites the variables with current values —
useful if a resource was recreated and an ID changed.

## If you change the module's outputs

If a future module version renames or adds an output, update three places in
lockstep: the wrapper `output` blocks, the `gh variable set` calls in
`bootstrap.sh`, and the `vars.*` references in the workflows. Keeping these
names stable is what makes the handoff "just work".

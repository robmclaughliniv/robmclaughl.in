# Safety boundaries

These are the hard rules for the deploy apparatus. They exist because every app
shares one set of foundational primitives owned by the root `robmclaughl.in`
infrastructure. Violating them can take down *every* site, not just this app.

## Never touch shared primitives

The following are **read-only** — the `static-site` module looks them up via
data sources and must never create, modify, import, or destroy them:

- The Route 53 hosted zone for `robmclaughl.in` (`Z2PPIVE6CKK74T`).
- The ACM certificate covering `robmclaughl.in`, `www`, and `*.robmclaughl.in`
  (us-east-1).
- The shared CLOUDFRONT-scoped WAF Web ACL (us-east-1).
- The shared CloudFront response-headers policy.
- The GitHub OIDC provider in IAM.
- The shared Terraform state bucket and the root site's state object.

If a `terraform plan` ever shows a create/change/destroy against any of these,
**stop** and investigate — it means a lookup failed or the wrong resource is
being managed.

## State isolation

Each app uses its **own** state object: `apps/<app_name>/terraform.tfstate` in
the shared state bucket, with S3-native locking (`use_lockfile = true`). Never
point an app at the root key (`terraform.tfstate`) or share a key between apps.

## Least privilege

- The per-app GitHub Actions role is scoped to *that app's* bucket, distribution,
  and (if present) Lambda — never `*` resources.
- Tighten `allowed_oidc_subjects` to specific branches once the deploy flow is
  proven, e.g. `["repo:<owner>/<repo>:ref:refs/heads/master"]`.

## Preserve security posture

Don't weaken what the module sets up: keep S3 public access fully blocked
(content is served only via CloudFront OAC), keep `viewer_protocol_policy` at
`redirect-to-https`, keep the security-headers policy attached, and keep WAF
enabled unless there's a deliberate, documented reason not to.

## Naming / collisions

Global names (S3 bucket, IAM role/policies, CloudFront function, OAC) are
namespaced by the app's FQDN. Don't hand-pick names that could collide with
another app or with the root site's existing resources (e.g. the root's
`github-actions-deploy-role`, `security-headers-policy`, `robmclaughl-in-*`).

## Subdomain shape

Subdomains must be a **single DNS label** (e.g. `app`, not `a.b`) so they're
covered by the `*.robmclaughl.in` wildcard certificate. A multi-level host would
not be covered and TLS would fail.

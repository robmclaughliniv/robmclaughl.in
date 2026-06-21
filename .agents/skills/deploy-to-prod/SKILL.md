---
name: deploy-to-prod
description: Scaffold complete production hosting for a static or client-side SPA front-end (with an optional same-origin /api) on the shared robmclaughl.in AWS infrastructure. Use this whenever the user wants to deploy, ship, launch, or "go live" with an app — especially phrases like "deploy this to prod", "put this on a robmclaughl.in subdomain", "make this site live", "set up CI/CD and hosting", "get this on the internet", or "wire up S3/CloudFront/Route53 for this repo". Use it even when the user doesn't name AWS or Terraform explicitly but clearly wants a built front-end served over HTTPS on a custom domain.
---

# deploy-to-prod

Stand up everything a front-end needs to be live over HTTPS on
`robmclaughl.in` (or a single-level subdomain): a private S3 bucket, a
CloudFront distribution, DNS, a least-privilege GitHub Actions OIDC role, and —
optionally — a same-origin `/api/*` Lambda. One bootstrap, push to the default
branch, and the app is live. No certificate requests, no DNS console clicking.

This works by generating a thin **Terraform wrapper** around the shared
`static-site` module plus a **Terraform-free CI workflow** and a **bootstrap
script** that bridges the two. The heavy lifting (and all the shared-primitive
lookups) lives in the module; this skill just wires a specific app to it.

## How it fits together

```
your build (Next export / Vite / etc.)
        │  aws s3 sync
        ▼
   S3 (private) ──OAC──> CloudFront ──> https://<app>.robmclaughl.in
                              │ /api/*  (optional)
                              ▼
                        API Gateway ──> Lambda
```

- **Terraform** provisions infra and emits outputs (`role_arn`, `bucket_name`,
  `distribution_id`, `lambda_function_name`, `site_url`).
- **`bootstrap.sh`** applies Terraform and copies those outputs into GitHub
  Actions repo variables.
- **`deploy.yml`** builds the site and pushes content via OIDC — it never runs
  Terraform, so day-to-day deploys are fast and can't drift infra.

Read `references/handoff-contract.md` for the exact output→variable mapping.

## Before you start

**Read `references/safety-boundaries.md` now.** Every app shares one hosted
zone, one wildcard certificate, and one WAF. The module treats those as
read-only; your job is to never generate config that creates or mutates them.

Confirm the foundation exists (it does in this account, but verify if unsure):
the `static-site` module is published at a git tag, the shared state bucket
`robmclaughl-in-terraform-state` exists, and the `*.robmclaughl.in` cert is
`ISSUED`. If the module tag doesn't exist yet, stop and surface that — the
wrapper pins it by `?ref=`.

## Step 1 — Detect the archetype and collect inputs

Determine which of these you're building:

- **Subdomain static site** — the common case. `subdomain` set, no API.
- **Subdomain SPA + API** — same, plus a same-origin `/api/*`.
- **Root site** — apex + `www` (this is the root repo's own backport; only do
  this if explicitly asked).

Collect inputs, inferring as much as possible and only asking when genuinely
ambiguous:

| Input | How to infer | Ask if unclear |
| --- | --- | --- |
| `app_name` | repo name (kebab-case) | confirm if repo name is noisy |
| `subdomain` | usually `app_name`; empty for root mode | which subdomain they want |
| `repo` | `gh repo view --json nameWithOwner -q .nameWithOwner` or the git remote | — |
| `enable_api` | presence of an `api/`, `lambda/`, or server route dir | whether they want a backend |
| `enable_dynamodb` | only if API needs persistence | — |
| `spa_mode` | see Step 2 (framework-dependent) | — |

`app_name` and `subdomain` must be a single DNS label (lowercase, no dots) so
the wildcard cert covers the host.

## Step 2 — Auto-detect the toolchain

Inspect the repo and resolve the build the CI workflow needs. Detect the
**package manager** from the lockfile, the **framework** from config files, and
set `spa_mode` accordingly:

| Signal | Framework | `__BUILD_CMD__` | `__OUTPUT_DIR__` | `spa_mode` |
| --- | --- | --- | --- | --- |
| `next.config.*` with `output: 'export'` | Next (static export) | `<pm> run build` | `out` | `false` |
| `next.config.*` without export | Next (SSR) | — | — | **not static — stop** |
| `vite.config.*` | Vite | `<pm> run build` | `dist` | `true` |
| `react-scripts` in deps | CRA | `<pm> run build` | `build` | `true` |
| `astro.config.*` | Astro | `<pm> run build` | `dist` | `false` |
| `svelte.config.*` (static adapter) | SvelteKit | `<pm> run build` | `build` | `true` |
| `index.html` at root, no build tool | plain static | *(none — drop build step)* | `.` | `false` |

Package manager → tokens:

| Lockfile | `__PKG_MANAGER__` | `__INSTALL_CMD__` | Setup step |
| --- | --- | --- | --- |
| `pnpm-lock.yaml` | `pnpm` | `pnpm install --frozen-lockfile` | keep `pnpm/action-setup` (set `__PNPM_VERSION__` from `packageManager` field or major version) |
| `package-lock.json` | `npm` | `npm ci` | remove the pnpm setup step |
| `yarn.lock` | `yarn` | `yarn install --frozen-lockfile` | remove the pnpm setup step |
| `bun.lockb` | `bun` | `bun install` | replace setup with `oven-sh/setup-bun` |

`__NODE_VERSION__`: from `.nvmrc` or `engines.node`, else `20`.
`__DEFAULT_BRANCH__`: `git symbolic-ref --short refs/remotes/origin/HEAD` (strip
`origin/`), else `main`.
`__MODULE_REF__`: the latest `static-site-vX.Y.Z` tag in the root repo.

If the framework isn't static-exportable (e.g. Next SSR, Remix server), stop and
tell the user — this apparatus serves static assets + an optional Lambda API, not
a server-rendered runtime.

## Step 3 — Scaffold the files (idempotently)

Copy the templates from `assets/` into the target repo and replace every
`__TOKEN__`. **Check for existing files first** — if `terraform/main.tf`,
`.github/workflows/deploy.yml`, or `scripts/bootstrap.sh` already exist, show a
diff and confirm before overwriting rather than clobbering prior work.

| Template | Destination |
| --- | --- |
| `assets/terraform/main.tf` | `terraform/main.tf` |
| `assets/terraform/.gitignore` | `terraform/.gitignore` |
| `assets/workflows/deploy.yml` | `.github/workflows/deploy.yml` |
| `assets/scripts/bootstrap.sh` | `scripts/bootstrap.sh` (then `chmod +x`) |
| `assets/workflows/deploy-api.yml` | `.github/workflows/deploy-api.yml` **(only if `enable_api`)** |

Token reference (replace in all copied files):

- `__APP_NAME__`, `__SUBDOMAIN__`, `__REPO__`, `__MODULE_REF__`
- `__SPA_MODE__`, `__ENABLE_API__`, `__ENABLE_DYNAMODB__` (literal `true`/`false`)
- `__DEFAULT_BRANCH__`, `__PKG_MANAGER__`, `__PNPM_VERSION__`, `__NODE_VERSION__`
- `__INSTALL_CMD__`, `__BUILD_CMD__`, `__OUTPUT_DIR__`
- API only: `__API_SRC_DIR__`, `__API_BUILD_CMD__`, `__API_ARTIFACT__`

For a static-only site, set `__ENABLE_API__`/`__ENABLE_DYNAMODB__` to `false`
and do **not** copy `deploy-api.yml`. Adjust the workflow's toolchain block to
match the detected package manager (the templates default to pnpm; swap the
setup/install steps per the table above). For a plain-static repo with no build,
remove the Setup/Install/Build steps and set `__OUTPUT_DIR__` to the content dir.

After writing, double-check there are no remaining `__` tokens:
`grep -rn "__[A-Z_]*__" terraform .github scripts` should return nothing.

## Step 4 — Bootstrap (review, then apply)

This is the one step that touches AWS. It requires `terraform`, `aws`
(authenticated), and `gh` (authenticated). Run it and **review the plan before
approving**:

```bash
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh
```

The script runs `terraform init` + `plan`, pauses for you to confirm, then
`apply`s and sets the repo variables. Before approving the plan, verify it only
**creates this app's resources** and shows **no changes to the shared zone,
certificate, or WAF** (per the safety boundaries). If it does, abort.

## Step 5 — First deploy and verify

```bash
git add terraform .github/workflows scripts
git commit -m "chore: add production deploy apparatus"
git push
```

The push triggers `deploy.yml`. CloudFront takes ~5–15 min on first creation.
Then verify:

```bash
curl -sI https://<app>.robmclaughl.in | head -n 1   # expect HTTP/2 200
```

If the API add-on is enabled, the first `deploy-api.yml` run ships real Lambda
code over the placeholder; test an endpoint at `https://<app>.robmclaughl.in/api/...`.

## A complete worked example

See `references/example-craps-trainer.md` for an end-to-end run
(`craps-trainer.robmclaughl.in`, Vite SPA, no API) showing the resolved tokens,
generated files, and verification.

## v2 extension points (do NOT build these now)

The design intentionally leaves room for, but this version does not implement:

- **Preview environments** per PR/branch (the root site does this via a
  `/branch/*` prefix + lifecycle expiry). A v2 could add a preview workflow and
  a wildcard-path behavior.
- **Promoting shared primitives to per-stack overrides** (e.g. a custom WAF or
  per-app logging bucket) beyond the existing `csp_override` escape hatch.
- **Multi-region or non-`us-west-2`** deployments.
- **Tightened OIDC subjects by default** (currently `repo:<repo>:*`; production
  hardening would scope to specific branches).

Note these to the user if relevant, but keep v1 focused on the PROD lifecycle.

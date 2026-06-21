# Worked example: craps-trainer.robmclaughl.in

A complete walkthrough for a Vite + React single-page app that should live at
`craps-trainer.robmclaughl.in`, with no API.

## Inputs collected

| Input | Value | How determined |
| --- | --- | --- |
| `app_name` | `craps-trainer` | from repo name / user |
| `subdomain` | `craps-trainer` | user wants a subdomain |
| `repo` | `robmclaughliniv/craps-trainer` | `gh repo view` / git remote |
| archetype | subdomain static SPA | Vite app, single subdomain |
| `spa_mode` | `true` | Vite SPA → client-side routing |
| `enable_api` | `false` | no backend needed |

## Toolchain detected

| Signal | Detected |
| --- | --- |
| `pnpm-lock.yaml` present | package manager = `pnpm` |
| `vite.config.ts` present | framework = Vite |
| Vite default | build = `pnpm run build`, output = `dist/` |
| `.nvmrc` = `20` | node = `20` |

## Files generated

```
terraform/
  main.tf          # wrapper: subdomain="craps-trainer", spa_mode=true, enable_api=false
  .gitignore
.github/workflows/
  deploy.yml       # pnpm build -> sync dist/ -> invalidate
scripts/
  bootstrap.sh
```

The wrapper's module block ends up as:

```hcl
module "site" {
  source = "git::https://github.com/robmclaughliniv/robmclaughl.in.git//terraform/modules/static-site?ref=static-site-v1.0.1"

  app_name  = "craps-trainer"
  subdomain = "craps-trainer"
  repo      = "robmclaughliniv/craps-trainer"
  spa_mode  = true

  enable_api      = false
  enable_dynamodb = false

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}
```

And `deploy.yml`'s toolchain block resolves to:

```yaml
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Build
        run: pnpm run build
```

with `aws s3 sync dist "s3://${{ vars.S3_BUCKET }}/" --delete`.

## Bootstrap + first deploy

```bash
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh        # review plan -> yes -> applies + sets gh vars

git add terraform .github/workflows scripts
git commit -m "chore: add production deploy apparatus"
git push                      # triggers deploy.yml
```

After the CloudFront distribution finishes deploying and the workflow completes:

```bash
curl -sI https://craps-trainer.robmclaughl.in | head -n 1   # HTTP/2 200
```

No certificate step, no DNS console clicking — the wildcard cert and shared zone
already cover the new subdomain.

## If it had an API

Setting `enable_api = true` (and optionally `enable_dynamodb = true`) would
additionally generate `.github/workflows/deploy-api.yml`, provision a Lambda +
HTTP API, route `/api/*` through CloudFront to it (same-origin, no CORS), and
set the `LAMBDA_FUNCTION_NAME` repo variable. App code would call `/api/...`
directly.

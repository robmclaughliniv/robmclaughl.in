# Active Context

*This document tracks the current focus, recent activities, immediate next steps, and important decisions or patterns relevant to the ongoing work. It's a snapshot of the project's current state. **Updated: [Current Date]**.*

## Current Focus

*   **Primary:** Polishing the homepage UI to achieve a retro-futuristic CRT monitor aesthetic (effects restored).
*   **Secondary:** Utilizing and refining the new ephemeral preview environment workflow.
*   **Next:** Implement baseline UI tests using Cypress.
*   **Long-term Vision:** Evolve the page into a "lofi vibe generator" inspired by lofi.cafe, featuring:
    *   An integrated audio player.
    *   AI-driven visuals.
    *   Clickable "channels" to change music and visuals.
    *   Links/elements connecting to subdomains showcasing web experiments.

## Recent Changes (Since April 5, 2025 - Preview Env Implementation)

*   **Implemented Ephemeral Preview Environments:**
    *   Modified GitHub Actions workflow (`.github/workflows/deploy.yml`) to deploy Pull Request branches to S3 prefixes (`s3://<bucket>/branch/<branch-slug>/`).
    *   Configured Next.js (`next.config.mjs`) to use `basePath` based on environment variable (`BASE_PATH=/branch/<branch-slug>`) set during preview builds.
    *   Workflow posts preview URL comments to associated Pull Requests.
    *   Workflow includes job to automatically clean up S3 prefix and invalidate CloudFront cache when a PR branch is deleted.
    *   Added S3 Lifecycle Policy via Terraform to expire objects under `branch/` prefix after 30 days as a cleanup backup.
*   **Troubleshooting Preview Environments:**
    *   Resolved PNPM lockfile compatibility issues in CI by updating PNPM version in workflow (`pnpm/action-setup`) to match local version (10.7.1).
    *   Resolved `ERR_PNPM_TARBALL_INTEGRITY` errors by refreshing `pnpm-lock.yaml` locally and committing the update.
    *   Resolved AWS credential loading errors (`Could not load credentials`) by moving necessary secrets (`AWS_DEPLOY_ROLE_ARN`, `CLOUDFRONT_DISTRIBUTION_ID`, `AWS_S3_BUCKET_NAME`, `DOMAIN_NAME`) from Environment Secrets (scoped to `prod`) to Repository Secrets, making them available to all jobs.
    *   Resolved `AccessDenied` errors when accessing preview URLs (`.../branch/<slug>/`) by creating and associating a CloudFront Function (`append-index-html`) to rewrite URIs ending in `/` or without extensions to append `/index.html`.
    *   Resolved shell parsing errors (`unexpected EOF`) in final `echo` command of preview job by switching to `printf` and adjusting quoting.
*   Implemented CloudFront Function (`index_rewrite`) via Terraform to resolve `AccessDenied` errors when accessing subdirectory paths without explicitly specifying `index.html` (e.g., `/branch/staging-env/`).
*   Configured the CloudFront distribution (via Terraform) to associate the `index_rewrite` function only with specific path patterns defined in a variable (`var.index_rewrite_paths`, initially `["/branch/*"]`), rather than applying it globally.
*   (Previous changes: Resolved CSP issue, restored CRT effects, security improvements, Terraform fixes).

## Immediate Next Steps

1.  **✅ CloudFront Subdirectory Index Handling:** Implemented CloudFront Function via Terraform.
2.  **Next: Baseline Testing:** Implement basic functional UI tests using Cypress.

## Active Decisions & Considerations

*   **Preview Environment URL Structure:** Previews are accessible at `https://<domain>/branch/<sanitized-branch-name>`. Branch names are sanitized (lowercase, alphanumeric + hyphen only).
*   **Secrets Management:** Key deployment secrets are now managed at the Repository level for accessibility by all workflow jobs.
*   **CloudFront Function for Index Files:** Relying on a CloudFront Function to serve `index.html` for directory-like requests.
*   **CloudFront Function for Index Rewrites:** Using a CloudFront Function associated with specific cache behaviors (driven by the `index_rewrite_paths` Terraform variable) is the chosen method for handling subdirectory index files. This provides flexibility to add more paths later without modifying the function code.
*   **CSP `'unsafe-inline'`:** Currently allowing `'unsafe-inline'` scripts via CloudFront CSP as a necessary workaround for Next.js compatibility with CDN-level headers. More secure alternatives (hashes, nonces) are complex to implement in this setup.
*   **No Analytics:** Analytics implementation is deferred.
*   (Previous decisions: CSP `unsafe-inline`, no analytics/dark mode/blog, core focus on generator concept).

## Key Patterns & Preferences

*   Leverage Next.js `basePath` for deploying branches to subpaths.
*   Use GitHub Actions for multi-job CI/CD (prod deploy, preview deploy, preview cleanup).
*   Use Repository Secrets for credentials shared across CI jobs.
*   Use CloudFront Functions for edge request modifications (e.g., default index file).
*   (Previous patterns: Next.js SSG, Tailwind, shadcn/ui, Terraform IaC, OIDC).

## Learnings & Insights (Recent - Preview Envs)

*   GitHub Actions jobs only inherit secrets available at their scope (Repository or specified Environment).
*   PNPM requires lockfile (`pnpm-lock.yaml`) commitment and consistent versions between local dev and CI (`pnpm/action-setup` version).
*   `ERR_PNPM_TARBALL_INTEGRITY` often indicates a republished package version requiring a lockfile refresh (`rm -rf node_modules && pnpm i`).
*   OIDC credential loading failures usually point to incorrect Role ARN secret values or misconfigured IAM Role Trust Policies.
*   Shell command parsing in GitHub Actions `run:` steps can be sensitive; `printf` can be more robust than `echo` for complex strings with variable interpolation.
*   Serving static sites from S3 subdirectories via CloudFront often requires a CloudFront Function or Lambda@Edge to rewrite requests for directory paths (`/foo/`) to the index document (`/foo/index.html`). OAC alone doesn't handle this.
*   **CloudFront Functions for URI Rewrites:** CloudFront Functions provide a lightweight, edge-based solution to modify requests, such as appending `index.html` to directory-like URIs, before they reach the origin (S3). This avoids `AccessDenied` errors when S3 is not configured for website hosting (which is correct when using CloudFront OAC).
*   **Targeted Function Association:** Associating CloudFront Functions with specific `ordered_cache_behavior` blocks (based on path patterns) instead of the `default_cache_behavior` allows for precise control over where the function logic is applied.
*   **Terraform Dynamic Blocks:** Using `dynamic "ordered_cache_behavior"` with `for_each` allows creating multiple cache behaviors based on a list variable, making the configuration flexible and maintainable for multiple path patterns requiring the same function.
*   **CSP and Next.js:** Implementing strict Content Security Policies (especially `script-src 'self'`) via CDN headers (like CloudFront Response Headers Policy) can conflict with Next.js's reliance on inline scripts for hydration/functionality, causing rendering failures (e.g., blank screens after initial load).
*   (Previous learnings: CSP/Next.js, troubleshooting, AWS security, Terraform resource management, HeroBackground optimizations, IaC/CI/CD setup benefits). 
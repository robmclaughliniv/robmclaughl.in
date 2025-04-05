# Technical Context

*This document details the technologies used in the project, development environment setup, technical constraints, dependencies, and specific tool usage patterns.*

## Technology Stack

*   **Frontend:** Next.js 13 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui components.
*   **Backend:** N/A (Static site generation for MVP).
*   **Infrastructure:** AWS (S3 for hosting, CloudFront for CDN & HTTPS, Route 53 for DNS, ACM for SSL certificates, CloudFront Functions for edge logic). Infrastructure as Code managed by Terraform.
*   **Security:** AWS WAFv2 (associated with CloudFront, using Managed Rules).
*   **CI/CD:** GitHub Actions.
*   **Other Key Technologies:** AWS CLI (for deployment scripts).

## Development Environment Setup

*   **Core Tools:** Node.js, pnpm (`v10.7.1` used locally and in CI).
*   **Setup:** Clone repository, run `pnpm install` to install dependencies. Commit `pnpm-lock.yaml`.
*   **Running Locally:** `pnpm run dev` (standard Next.js command found in `package.json`).
*   **Environment Variables:**
    *   `BASE_PATH`: Used during `deploy-preview` CI job build step to configure Next.js `basePath` (e.g., `/branch/<branch-slug>`). Not used for local dev or production builds.

## Technical Constraints

*   **MVP Focus:** Initial build is a minimal single-page application.
*   **Performance:** Must load quickly (leveraging static generation and CDN).
*   **Responsiveness:** Must work well across mobile, tablet, and desktop.
*   **Security:** Must use HTTPS, secure S3 bucket configuration (OAC), secure CI/CD (OIDC), security headers via CloudFront Response Headers Policy (Note: CSP `script-src` requires `'unsafe-inline'` due to Next.js needs), and access logging. Avoid revealing implementation details (e.g., disable `x-powered-by` header).
*   **Timeline:** Initial MVP targeted for rapid completion ("tonight").

## Key Dependencies

*   **Framework:** Next.js (`^15.1.0` as per package.json, `output: 'export'`, uses `basePath` for previews)
*   **UI Library:** React (`^18.2.0`)
*   **Styling:** Tailwind CSS (`^3.4.17`), class-variance-authority, clsx, tailwind-merge, tailwindcss-animate.
*   **Components:** Numerous `@radix-ui/*` and `shadcn/ui` components (see `package.json` for full list, e.g., `lucide-react` for icons).
*   **Infrastructure:** AWS Services (S3, CloudFront, Route53, ACM).
*   **Deployment:** GitHub Actions, Terraform.

## Tool Usage & Conventions

*   **Version Control:** Git, hosted on GitHub. Production branch: `master`. Feature branches used for Pull Requests and preview environments.
*   **Package Manager:** `pnpm` (`v10.7.1`). Use `pnpm install`, `pnpm run dev`, `pnpm run build`. `pnpm-lock.yaml` is committed.
*   **Linters/Formatters:** TypeScript is used. Assumed standard tools like ESLint/Prettier configured.
*   **Testing:** Not implemented yet (Next step: Cypress).
*   **Build Process:** `pnpm run build` (uses `next build --no-lint`). Generates static assets in `out/` directory. `BASE_PATH` env var used for preview builds.
*   **Deployment:** Automated via GitHub Actions workflow (`.github/workflows/deploy.yml`):
    *   **Triggers:** `push` to `master` (production), `pull_request` (preview), `delete` branch (cleanup).
    *   **Jobs:** `deploy-prod`, `deploy-preview`, `cleanup-preview`.
    *   **Authentication:** Uses OIDC for secure AWS role assumption.
    *   **Secrets:** Uses Repository Secrets (`AWS_DEPLOY_ROLE_ARN`, `CLOUDFRONT_DISTRIBUTION_ID`, `AWS_S3_BUCKET_NAME`, `DOMAIN_NAME`).
    *   **Process:** Installs deps (`pnpm i --frozen-lockfile`), builds, syncs `out/` to S3 (root for prod, `branch/<slug>/` for preview), invalidates CloudFront, posts PR comment (previews), removes S3 prefix (cleanup).
*   **Terraform Configuration:**
    *   Manages AWS resources (S3, CloudFront, Route53, ACM, IAM Role).
    *   Uses S3 backend with DynamoDB locking.
    *   Includes S3 lifecycle rule to expire `branch/` prefix objects after 30 days.
    *   Defines WAFv2 Web ACL in `us-east-1` (using aliased provider) and associates it with CloudFront distribution.
*   **CloudFront Function:** `append-index-html` function (created manually) associated with default behavior Viewer Request event to handle index file resolution.

## Tool Usage & Conventions

*   **Version Control:** Git, hosted on GitHub. Deployment triggered from the `main` branch. Specific branching strategy not defined yet.
*   **Package Manager:** `pnpm`. Use `pnpm install`, `pnpm run dev`, `pnpm run build`.
*   **Linters/Formatters:** TypeScript is used. Assumed standard tools like ESLint/Prettier are configured (typical for Next.js starter). Config files: `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`.
*   **Testing:** Not implemented in MVP.
*   **Build Process:** `pnpm run build` (uses `next build`). Likely generates static assets for deployment.
*   **Deployment:** Automated via GitHub Actions workflow (`.github/workflows/deploy.yml`). Uses OIDC for secure AWS authentication. Builds the site using pnpm, syncs static files to S3, invalidates CloudFront cache. Infrastructure defined in Terraform (`terraform/` directory) with state stored in S3 backend.
*   **Terraform Configuration:**
    *   **State Management:** Uses S3 backend (`robmclaughl-in-terraform-state` bucket) with DynamoDB locking (`terraform-locks` table).
    *   **Route53 Configuration:** Uses hardcoded Zone ID (`Z2PPIVE6CKK74T`) with `allow_overwrite = true` to manage existing DNS records.
    *   **ACM Validation:** Configures DNS validation records for SSL certificates with proper provider configuration.
    *   **Module Structure:** Organized in modules (`route53`, `acm`, `cloudfront`, `s3`, `iam`) for maintainability.
    *   **WAF Configuration:** Defines `aws_wafv2_web_acl` scoped to `CLOUDFRONT` in `us-east-1` (using `aws.us_east_1` provider alias) and associates it via `web_acl_id` in CloudFront distribution. 
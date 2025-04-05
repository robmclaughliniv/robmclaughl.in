# System Patterns

*This document outlines the system's architecture, key technical decisions, design patterns employed, component relationships, and critical implementation details.*

## System Architecture Overview

*   **Frontend Application:** Single-page application built with Next.js (App Router), using Static Site Generation (`output: 'export'`). Uses `basePath` configuration for preview environment deployments.
*   **Hosting:** Static assets hosted on AWS S3. Production files at root, preview branches under `branch/<branch-slug>/` prefix.
*   **Delivery:** AWS CloudFront CDN serves assets globally, provides HTTPS via ACM certificate, points to the S3 origin using Origin Access Control (OAC). Security headers applied via CloudFront Response Headers Policy. Access logging enabled. A CloudFront Function (`append-index-html`) is associated with the Viewer Request event to handle serving index files for directory paths.
*   **Security:** AWS WAF associated with CloudFront, using managed rules (`AWSManagedRulesCommonRuleSet`, `AWSManagedRulesAmazonIpReputationList`) to filter traffic before it reaches CloudFront.
*   **DNS:** AWS Route 53 manages the `robmclaughl.in` domain, pointing to the CloudFront distribution.
*   **Infrastructure Management:** All AWS resources defined and managed using Terraform (IaC). Includes S3 Lifecycle Policy to expire preview branches (objects under `branch/` prefix) after 30 days.
*   **Deployment Pipeline:** GitHub Actions workflow (`.github/workflows/deploy.yml`) with separate jobs for:
    *   `deploy-prod`: Triggers on push to `master`, deploys build output to S3 root.
    *   `deploy-preview`: Triggers on `pull_request` events, builds with `basePath`, deploys to S3 `branch/<branch-slug>/` prefix, posts comment to PR.
    *   `cleanup-preview`: Triggers on non-`master` branch `delete`, removes S3 `branch/<branch-slug>/` prefix.

```mermaid
graph TD
    subgraph "AWS Cloud"
        R53[Route 53: robmclaughl.in] --> WAF[AWS WAF: Managed Rules];
        WAF --> CF[CloudFront Distribution];
        CF -- Viewer Request --> CFFunc[CF Function: append-index-html];
        CFFunc -- Modified URI --> CF;
        CF -- OAC --> S3[S3 Bucket: Static Files
          - /index.html
          - /_next/...
          - /branch/slug-1/index.html
          - /branch/slug-1/_next/...
          - /branch/slug-2/index.html
          - ...];
        ACM[ACM Certificate] -- Attached --> CF;
    end

    subgraph "Development & Deployment"
        User[Developer] -- Push PR Branch --> GitHub[GitHub Repo];
        GitHub -- Trigger PR --> GHA_Preview[GHA: deploy-preview];
        GHA_Preview -- Build w/ basePath --> Build[Next.js Build Output];
        GHA_Preview -- Assumes Role via OIDC --> AWS_IAM[AWS IAM Role];
        GHA_Preview -- Deploy --> S3;
        GHA_Preview -- Invalidate --> CF;
        GHA_Preview -- Comment --> GitHub;

        User[Developer] -- Push master --> GitHub;
        GitHub -- Trigger Push --> GHA_Prod[GHA: deploy-prod];
        GHA_Prod -- Build --> Build;
        GHA_Prod -- Assumes Role --> AWS_IAM;
        GHA_Prod -- Deploy --> S3;
        GHA_Prod -- Invalidate --> CF;

        User[Developer] -- Delete PR Branch --> GitHub;
        GitHub -- Trigger Delete --> GHA_Cleanup[GHA: cleanup-preview];
        GHA_Cleanup -- Assumes Role --> AWS_IAM;
        GHA_Cleanup -- Remove --> S3;
        GHA_Cleanup -- Invalidate --> CF;

        Terraform[Terraform Code] -- Defines --> R53;
        Terraform -- Defines --> CF;
        Terraform -- Defines --> S3;
        Terraform -- Defines --> ACM;
        Terraform -- Defines --> AWS_IAM;
        # Note: CF Function created manually/outside Terraform for now
    end

    Client[User Browser] -- HTTPS /branch/slug-1/ --> R53;

    style S3 fill:#f9f,stroke:#333,stroke-width:2px
    style WAF fill:#ffc,stroke:#333,stroke-width:2px
    style CF fill:#ccf,stroke:#333,stroke-width:2px
    style R53 fill:#cfc,stroke:#333,stroke-width:2px
    style GHA_Preview fill:#fcf,stroke:#333,stroke-width:2px
    style GHA_Prod fill:#fcf,stroke:#333,stroke-width:2px
    style GHA_Cleanup fill:#fcf,stroke:#333,stroke-width:2px
    style Terraform fill:#fec,stroke:#333,stroke-width:2px
    style CFFunc fill:#cff,stroke:#333,stroke-width:2px
```

## Key Technical Decisions

*   **Framework Choice (Next.js):** Chosen for performance (SSR/SSG), SEO benefits, TypeScript support, and React ecosystem. App Router used for modern features.
*   **Styling (Tailwind CSS + shadcn/ui):** Utility-first CSS for rapid development and custom styling. Shadcn/ui provides accessible, pre-built components compatible with Tailwind.
*   **Hosting (AWS S3 + CloudFront):** Provides scalable, secure, and performant static site hosting with global CDN delivery, HTTPS, security headers (including CSP requiring `script-src 'unsafe-inline'` for Next.js compatibility), and access logging.
*   **Security (AWS WAF):** Integrated with CloudFront to provide managed protection against common web exploits (OWASP Top 10, malicious IPs) at the edge.
*   **CloudFront Functions:** Using a lightweight edge function (`index_rewrite`) to handle URI rewrites (appending `index.html`) for specific subdirectory path patterns, enabling clean URLs without needing S3 website hosting features.
*   **Infrastructure as Code (Terraform):** Ensures reproducible, version-controlled, and automated management of AWS resources.
    *   **Route53 Management:** Uses hardcoded Zone ID with `allow_overwrite = true` to safely manage existing DNS records.
*   **CI/CD (GitHub Actions):** Multi-job workflow for production, preview deployment, and cleanup.
    *   Triggers based on `push` (master), `pull_request`, and `delete` events.
    *   Uses Repository Secrets for AWS credentials.
*   **Secure AWS Authentication (OIDC):** Using OpenID Connect for temporary role assumption from GitHub Actions.

## Design Patterns in Use

*   **Static Site Generation (SSG):** Next.js `output: 'export'`. Pre-rendering pages to static HTML.
*   **Ephemeral Preview Environments:** Using Git branches, CI/CD, S3 prefixes, Next.js `basePath`, and PR comments to create temporary review environments.
*   **Infrastructure as Code (IaC):** Managing AWS infrastructure via Terraform.
*   **CI/CD:** Automating build, deployment, and cleanup (GitHub Actions).
*   **Web Application Firewall (WAF):** Using AWS WAF with managed rules at the CloudFront edge.
*   **CloudFront Edge Logic:** Using CloudFront Functions to modify requests at the edge (URL rewriting for index files).
*   **Utility-First CSS:** Tailwind CSS approach for styling.
*   **Component-Based Architecture:** Standard React pattern for UI development. Leveraging shadcn/ui components.
*   **Remote State Pattern:** Using S3 backend for state storage and DynamoDB for state locking.
*   **OIDC:** Using OpenID Connect for temporary role assumption.

## Component Relationships (MVP)

*   **`app/layout.tsx`:** Root layout likely wrapping the main page content, potentially including global elements like theme providers or metadata.
*   **`app/page.tsx`:** The main page component containing the core content (name, title, links).
*   **`components/*`:** Reusable UI components (e.g., `HeroBackground.tsx`, potentially buttons or icons from `shadcn/ui`). `page.tsx` imports and uses these components.
*   **Styling:** Tailwind utility classes applied directly within components. Global styles in `app/globals.css`.

## Critical Implementation Paths

*   **User Request Flow (Production):** User visits `robmclaughl.in` -> DNS (Route53) -> WAF (Filters request) -> CloudFront -> (Optional: CF Function sees `/`, rewrites to `/index.html`) -> S3 Origin (OAC) fetches `/index.html` -> Page Renders.
*   **User Request Flow (Preview):** User visits `robmclaughl.in/branch/slug-1/` -> DNS -> WAF (Filters request) -> CloudFront -> CF Function sees `/branch/slug-1/`, rewrites to `/branch/slug-1/index.html` -> S3 Origin (OAC) fetches `branch/slug-1/index.html` -> Page Renders.
*   **Production Deployment Flow:** Push to `master` -> `deploy-prod` job -> Checkout -> Install -> Build (no `basePath`) -> Assume Role -> Sync `out/` to S3 root -> Invalidate CF `/*`.
*   **Preview Deployment Flow:** Open/Update PR -> `deploy-preview` job -> Checkout -> Install -> Sanitize Branch Name (`slug`) -> Build (with `BASE_PATH=/branch/slug`) -> Assume Role -> Sync `out/` to S3 `branch/slug/` -> Invalidate CF `/branch/slug/*` -> Post PR Comment.
*   **Preview Cleanup Flow:** Delete PR branch -> `cleanup-preview` job -> Sanitize Branch Name (`slug`) -> Assume Role -> Remove S3 `branch/slug/` -> Invalidate CF `/branch/slug/*`.

## Data Management (MVP)

*   **Storage:** All website content is static (HTML, CSS, JS, images/videos) stored as files in an AWS S3 bucket.
*   **Access:** Files are accessed publicly via the AWS CloudFront CDN. Direct S3 access is restricted using OAC.
*   **Caching:** CloudFront provides edge caching for performance. Cache invalidation is triggered on deployment.
*   **Database:** No database is used in the MVP. 
# System Patterns

*This document outlines the system's architecture, key technical decisions, design patterns employed, component relationships, and critical implementation details.*

## System Architecture Overview

*   **Frontend Application:** Single-page application built with Next.js (App Router), using Static Site Generation (`output: 'export'`). Uses `basePath` configuration for preview environment deployments. Source in `/app`, `/components`, etc.
*   **Backend (Serverless):**
    *   **Compute:** AWS Lambda function (Node.js runtime, TypeScript source in `/lambda_src`).
    *   **Database:** AWS DynamoDB table (on-demand capacity, primary key `id`).
    *   **(Potential Trigger):** Not yet defined (e.g., API Gateway).
*   **Hosting:** Static assets hosted on AWS S3. Production files at root, preview branches under `branch/<branch-slug>/` prefix.
*   **Delivery:** AWS CloudFront CDN serves assets globally, provides HTTPS via ACM certificate, points to the S3 origin using Origin Access Control (OAC). Security headers applied via CloudFront Response Headers Policy. Access logging enabled. A CloudFront Function (`append-index-html`) is associated with the Viewer Request event to handle serving index files for directory paths.
*   **Security:** AWS WAF associated with CloudFront, using managed rules (`AWSManagedRulesCommonRuleSet`, `AWSManagedRulesAmazonIpReputationList`) to filter traffic before it reaches CloudFront. IAM roles and policies grant least privilege access (e.g., Lambda role access to specific DynamoDB table).
*   **DNS:** AWS Route 53 manages the `robmclaughl.in` domain, pointing to the CloudFront distribution.
*   **Infrastructure Management:** All AWS resources defined and managed using Terraform (IaC) in the `/terraform` directory. Includes S3 Lifecycle Policy to expire preview branches. State managed via S3 backend with DynamoDB locking.
*   **Deployment Pipeline:** GitHub Actions workflow (`.github/workflows/deploy.yml`) with separate jobs for:
    *   `deploy-prod`: Triggers on push to `master`, deploys build output to S3 root.
    *   `deploy-preview`: Triggers on `pull_request` events, builds with `basePath`, deploys to S3 `branch/<branch-slug>/` prefix, posts comment to PR.
    *   `cleanup-preview`: Triggers on non-`master` branch `delete`, removes S3 `branch/<branch-slug>/` prefix.
    *   **Note:** Deployment of Lambda requires a manual `pnpm run package` step in `/lambda_src` before `terraform apply`.

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
          - ...];
        ACM[ACM Certificate] -- Attached --> CF;

        subgraph "Serverless Backend (Managed by Terraform)"
            Lambda[Lambda Function: robmclaughlin-{env}-function];
            DynamoDB[DynamoDB Table: robmclaughlin-{env}];
            IAMRole[IAM Role: lambda_exec_role];
            IAMPolicy[IAM Policy: dynamodb_write_policy];
            CloudWatch[CloudWatch Log Group];
            Lambda -- Assumes --> IAMRole;
            IAMRole -- Has Policy --> IAMPolicy;
            IAMPolicy -- Allows Write --> DynamoDB;
            Lambda -- Writes Logs --> CloudWatch;
            # Potential Trigger (e.g., API Gateway) not shown
        end
    end

    subgraph "Development & Deployment"
        User[Developer] -- Push PR Branch --> GitHub[GitHub Repo];
        GitHub -- Trigger PR --> GHA_Preview[GHA: deploy-preview];
        GHA_Preview -- Build w/ basePath --> BuildFE[Next.js Build Output];
        GHA_Preview -- Assumes Role via OIDC --> AWS_IAM_Deploy[AWS IAM Role];
        GHA_Preview -- Deploy --> S3;
        GHA_Preview -- Invalidate --> CF;
        GHA_Preview -- Comment --> GitHub;

        User[Developer] -- Push master --> GitHub;
        GitHub -- Trigger Push --> GHA_Prod[GHA: deploy-prod];
        GHA_Prod -- Build --> BuildFE;
        GHA_Prod -- Assumes Role --> AWS_IAM_Deploy;
        GHA_Prod -- Deploy --> S3;
        GHA_Prod -- Invalidate --> CF;

        User[Developer] -- Delete PR Branch --> GitHub;
        GitHub -- Trigger Delete --> GHA_Cleanup[GHA: cleanup-preview];
        GHA_Cleanup -- Assumes Role --> AWS_IAM_Deploy;
        GHA_Cleanup -- Remove --> S3;
        GHA_Cleanup -- Invalidate --> CF;

        User[Developer] -- Run --> PnpmPackage[pnpm run package @ /lambda_src];
        PnpmPackage -- Creates --> BuildLambda[Lambda ZIP @ /build];

        TerraformCode[Terraform Code @ /terraform] -- Applied by --> User;
        TerraformCode -- Defines --> R53;
        TerraformCode -- Defines --> CF;
        TerraformCode -- Defines --> S3;
        TerraformCode -- Defines --> ACM;
        TerraformCode -- Defines --> AWS_IAM_Deploy;
        TerraformCode -- Defines --> Lambda;
        TerraformCode -- Defines --> DynamoDB;
        TerraformCode -- Defines --> IAMRole;
        TerraformCode -- Defines --> IAMPolicy;
        TerraformCode -- Defines --> CloudWatch;
        TerraformCode -- Uses --> BuildLambda;

    end

    Client[User Browser] -- HTTPS --> R53;

    style S3 fill:#f9f,stroke:#333,stroke-width:2px
    style WAF fill:#ffc,stroke:#333,stroke-width:2px
    style CF fill:#ccf,stroke:#333,stroke-width:2px
    style R53 fill:#cfc,stroke:#333,stroke-width:2px
    style Lambda fill:#ff9,stroke:#333,stroke-width:2px
    style DynamoDB fill:#9ff,stroke:#333,stroke-width:2px
    style TerraformCode fill:#fec,stroke:#333,stroke-width:2px

```

## Key Technical Decisions

*   **Framework Choice (Next.js):** Chosen for performance (SSR/SSG), SEO benefits, TypeScript support, and React ecosystem. App Router used for modern features.
*   **Backend Choice (Lambda + DynamoDB):** Added for potential future dynamic features, offering a scalable serverless approach.
*   **Styling (Tailwind CSS + shadcn/ui):** Utility-first CSS for rapid development and custom styling. Shadcn/ui provides accessible, pre-built components compatible with Tailwind.
*   **Hosting (AWS S3 + CloudFront):** Provides scalable, secure, and performant static site hosting with global CDN delivery, HTTPS, security headers (including CSP requiring `script-src 'unsafe-inline'` for Next.js compatibility), and access logging.
*   **Security (AWS WAF + IAM):** WAF integrated with CloudFront for edge protection. IAM roles/policies configured for least privilege access for Lambda.
*   **CloudFront Functions:** Using a lightweight edge function (`index_rewrite`) to handle URI rewrites (appending `index.html`) for specific subdirectory path patterns.
*   **Infrastructure as Code (Terraform):** Ensures reproducible, version-controlled, and automated management of all AWS resources (frontend and backend) within the `/terraform` directory.
*   **CI/CD (GitHub Actions):** Multi-job workflow for frontend production, preview deployment, and cleanup. Lambda deployment relies on Terraform apply (manual trigger after code package).
*   **Secure AWS Authentication (OIDC):** Using OpenID Connect for temporary role assumption from GitHub Actions (for frontend deployments).

## Design Patterns in Use

*   **Static Site Generation (SSG):** Next.js `output: 'export'` for the frontend.
*   **Serverless Computing:** AWS Lambda for backend logic.
*   **NoSQL Database:** AWS DynamoDB for data persistence.
*   **Ephemeral Preview Environments:** For the frontend application.
*   **Infrastructure as Code (IaC):** Managing all AWS infrastructure via Terraform.
*   **CI/CD:** Automating frontend build, deployment, and cleanup (GitHub Actions).
*   **Web Application Firewall (WAF):** Using AWS WAF with managed rules at the CloudFront edge.
*   **CloudFront Edge Logic:** Using CloudFront Functions to modify requests at the edge.
*   **Utility-First CSS:** Tailwind CSS approach for styling.
*   **Component-Based Architecture:** Standard React pattern for UI development.
*   **Remote State Pattern:** Using S3 backend for Terraform state storage and DynamoDB for state locking.
*   **OIDC:** Using OpenID Connect for temporary role assumption (for GHA deployment role).
*   **Least Privilege:** IAM policies grant specific permissions (e.g., Lambda role can only write to its designated DynamoDB table).

## Component Relationships (MVP + Backend)

*   **Frontend (`/app`, `/components`):**
    *   `app/layout.tsx`: Root layout.
    *   `app/page.tsx`: Main page component.
    *   `components/*`: Reusable UI components.
*   **Backend (`/lambda_src`):**
    *   `lambda_src/src/index.ts`: Lambda function handler code (TypeScript).
    *   Interacts with AWS SDK for DynamoDB (`@aws-sdk/lib-dynamodb`).
    *   Receives table name via environment variable set by Terraform.
*   **Infrastructure (`/terraform`):**
    *   Defines relationships between Lambda, IAM Role, IAM Policy, and DynamoDB Table.
    *   Defines frontend infrastructure (S3, CloudFront, etc.).
    *   Uses `archive_file` data source referencing `/build/lambda_function.zip`.

## Critical Implementation Paths

*   **User Request Flow (Production - Frontend):** User visits `robmclaughl.in` -> DNS (Route53) -> WAF -> CloudFront -> (Optional: CF Function rewrite) -> S3 Origin (OAC) -> Page Renders.
*   **User Request Flow (Preview - Frontend):** User visits `robmclaughl.in/branch/slug-1/` -> DNS -> WAF -> CloudFront -> CF Function rewrite -> S3 Origin (OAC) -> Page Renders.
*   **Frontend Deployment Flow (Prod/Preview/Cleanup):** As previously defined via GitHub Actions.
*   **Backend Deployment Flow:**
    1.  Developer modifies code in `/lambda_src`.
    2.  Developer runs `pnpm run package` in `/lambda_src` (builds TS, creates `/build/lambda_function.zip`).
    3.  Developer runs `terraform apply` in `/terraform` directory.
    4.  Terraform detects changes in `lambda_function.zip` (via `source_code_hash`) and updates the `aws_lambda_function` resource.
*   **(Potential) Lambda Invocation:** User action (e.g., API call) -> Trigger (e.g., API Gateway) -> Invokes `aws_lambda_function.main_lambda` -> Lambda code executes -> Writes to `aws_dynamodb_table.main_table` -> Returns response.

## Data Management (MVP + Backend)

*   **Frontend Storage:** Static assets (HTML, CSS, JS) in AWS S3, accessed via CloudFront.
*   **Backend Storage:** Data stored in AWS DynamoDB table (`robmclaughlin-{env}`).
    *   Managed via Terraform.
    *   Accessed by the Lambda function using AWS SDK.
*   **Caching:** CloudFront caches frontend assets. DynamoDB has its own caching options (DAX) if needed later. 
# System Patterns

*This document outlines the system's architecture, key technical decisions, design patterns employed, component relationships, and critical implementation details.*

## System Architecture Overview

*   **Frontend Application:** Single-page application built with Next.js (App Router), using Static Site Generation (`output: 'export'`). Uses `basePath` configuration for preview environment deployments. Source in `/app`, `/components`, etc.
*   **Backend (Serverless):**
    *   **Trigger:** AWS API Gateway HTTP API (`POST /contact`).
    *   **Compute:** AWS Lambda function (Node.js runtime, TypeScript source in `/lambda_src`). Handles request validation and DynamoDB interaction.
    *   **Database:** AWS DynamoDB table (on-demand capacity, primary key `id`).
*   **Hosting:** Static assets hosted on AWS S3. Production files at root, preview branches under `branch/<branch-slug>/` prefix.
*   **Delivery:** AWS CloudFront CDN serves assets globally, provides HTTPS via ACM certificate, points to the S3 origin using Origin Access Control (OAC). Security headers applied via CloudFront Response Headers Policy. Access logging enabled. A CloudFront Function (`append-index-html`) is associated with the Viewer Request event to handle serving index files for directory paths.
*   **Security:** AWS WAF associated with CloudFront. IAM roles and policies grant least privilege access (e.g., Lambda role access to specific DynamoDB table; **OIDC role for backend deployment workflow - permissions need refinement**).
*   **DNS:** AWS Route 53 manages the `robmclaughl.in` domain, pointing to the CloudFront distribution.
*   **Infrastructure Management:** All AWS resources defined and managed using Terraform (IaC) in the `/terraform` directory. Includes S3 Lifecycle Policy to expire preview branches. State managed via S3 backend with DynamoDB locking, using `dev` and `prod` workspaces.
*   **Deployment Pipeline:**
    *   **Frontend:** GitHub Actions workflow (`deploy.yml`) handles CI/CD (prod, preview, cleanup).
    *   **Backend:** GitHub Actions workflow (`deploy-backend.yml`) handles CI/CD.
        *   Builds Lambda package.
        *   Uses OIDC to authenticate to AWS.
        *   Runs Terraform `plan` on PRs (`dev` workspace).
        *   Runs Terraform `apply` on `master` pushes (`prod` workspace).
        *   **Note:** Relies on manually created IAM OIDC role.

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
            APIGW[API Gateway: HTTP API
              - POST /contact];
            Lambda[Lambda Function: robmclaughlin-{env}-function];
            DynamoDB[DynamoDB Table: robmclaughlin-{env}];
            IAMRoleLambda[IAM Role: lambda_exec_role];
            IAMPolicyLambda[IAM Policy: dynamodb_write_policy];
            CloudWatch[CloudWatch Log Group];

            APIGW -- Triggers --> Lambda;
            Lambda -- Assumes --> IAMRoleLambda;
            IAMRoleLambda -- Has Policy --> IAMPolicyLambda;
            IAMPolicyLambda -- Allows Write --> DynamoDB;
            Lambda -- Writes Logs --> CloudWatch;
            # Permissions for APIGW -> Lambda handled by aws_lambda_permission
        end
    end

    subgraph "Development & Deployment"
        User[Developer] -- Push PR Branch --> GitHub[GitHub Repo];
        GitHub -- Trigger PR --> GHA_FE_Preview[GHA: deploy.yml (preview)];
        GitHub -- Trigger PR --> GHA_BE_Plan[GHA: deploy-backend.yml (plan)];

        GHA_FE_Preview -- Build w/ basePath --> BuildFE[Next.js Build Output];
        GHA_FE_Preview -- Assumes Role via OIDC --> AWS_IAM_DeployFE[AWS IAM Role: Frontend];
        GHA_FE_Preview -- Deploy --> S3;
        GHA_FE_Preview -- Invalidate --> CF;
        GHA_FE_Preview -- Comment --> GitHub;

        GHA_BE_Plan -- Build Lambda --> BuildLambda[Lambda ZIP @ /build];
        GHA_BE_Plan -- Assumes Role via OIDC --> AWS_IAM_DeployBE[AWS IAM Role: Backend (OIDC)];
        GHA_BE_Plan -- Terraform Init/Plan --> TFPlan[Terraform Plan (dev)];
        # GHA_BE_Plan --> Comment Plan --> GitHub;

        User[Developer] -- Push master --> GitHub;
        GitHub -- Trigger Push --> GHA_FE_Prod[GHA: deploy.yml (prod)];
        GitHub -- Trigger Push --> GHA_BE_Apply[GHA: deploy-backend.yml (apply)];

        GHA_FE_Prod -- Build --> BuildFE;
        GHA_FE_Prod -- Assumes Role --> AWS_IAM_DeployFE;
        GHA_FE_Prod -- Deploy --> S3;
        GHA_FE_Prod -- Invalidate --> CF;

        GHA_BE_Apply -- Build Lambda --> BuildLambda;
        GHA_BE_Apply -- Assumes Role --> AWS_IAM_DeployBE;
        GHA_BE_Apply -- Terraform Init/Apply --> TFApply[Terraform Apply (prod)];
        TFApply -- Creates/Updates --> APIGW;
        TFApply -- Creates/Updates --> Lambda;
        TFApply -- Creates/Updates --> DynamoDB;
        TFApply -- Creates/Updates --> IAMRoleLambda;
        # etc...

        User[Developer] -- Run Manually --> PnpmPackage[pnpm run package @ /lambda_src];
        PnpmPackage -- Creates --> BuildLambda;
        User[Developer] -- Run Manually --> TFApplyLocal[Terraform Apply (local)];
        TFApplyLocal -- Uses --> BuildLambda;

        TerraformCode[Terraform Code @ /terraform] -- Used by --> GHA_BE_Plan;
        TerraformCode -- Used by --> GHA_BE_Apply;
        TerraformCode -- Used by --> TFApplyLocal;
    end

    Client[User Browser] -- HTTPS --> R53;
    Client -- API Call --> APIGW;

    style S3 fill:#f9f,stroke:#333,stroke-width:2px
    style WAF fill:#ffc,stroke:#333,stroke-width:2px
    style CF fill:#ccf,stroke:#333,stroke-width:2px
    style R53 fill:#cfc,stroke:#333,stroke-width:2px
    style APIGW fill:#f99,stroke:#333,stroke-width:2px
    style Lambda fill:#ff9,stroke:#333,stroke-width:2px
    style DynamoDB fill:#9ff,stroke:#333,stroke-width:2px
    style TerraformCode fill:#fec,stroke:#333,stroke-width:2px
    style AWS_IAM_DeployBE fill:#e99,stroke:#333,stroke-width:1px

```

## Key Technical Decisions

*   **Framework Choice (Next.js):** Chosen for performance (SSR/SSG), SEO benefits, TypeScript support, and React ecosystem. App Router used for modern features.
*   **Backend Choice (Lambda + DynamoDB + API Gateway):** Added API Gateway HTTP API as the trigger mechanism for the Lambda function.
*   **Styling (Tailwind CSS + shadcn/ui):** Utility-first CSS for rapid development and custom styling. Shadcn/ui provides accessible, pre-built components compatible with Tailwind.
*   **Hosting (AWS S3 + CloudFront):** Provides scalable, secure, and performant static site hosting with global CDN delivery, HTTPS, security headers (including CSP requiring `script-src 'unsafe-inline'` for Next.js compatibility), and access logging.
*   **Security (AWS WAF + IAM + OIDC):** Added OIDC for GitHub Actions backend workflow authentication. Acknowledged need to refine permissions for the OIDC role.
*   **CloudFront Functions:** Using a lightweight edge function (`index_rewrite`) to handle URI rewrites (appending `index.html`) for specific subdirectory path patterns.
*   **Infrastructure as Code (Terraform):** Now manages API Gateway resources as well. Uses `dev` and `prod` workspaces.
*   **CI/CD (GitHub Actions):** Implemented separate workflows for frontend (`deploy.yml`) and backend (`deploy-backend.yml`). Backend workflow handles Terraform apply triggered by pushes to `master`.
*   **Secure AWS Authentication (OIDC):** Using OpenID Connect for temporary role assumption from GitHub Actions (for both frontend and backend deployments, using potentially different roles).

## Design Patterns in Use

*   **Static Site Generation (SSG):** Next.js `output: 'export'` for the frontend.
*   **Serverless Computing:** AWS Lambda for backend logic, triggered by API Gateway.
*   **API Gateway Pattern:** Using HTTP API as a facade for the Lambda function.
*   **NoSQL Database:** AWS DynamoDB for data persistence.
*   **Ephemeral Preview Environments:** For the frontend application.
*   **Infrastructure as Code (IaC):** Managing all AWS infrastructure via Terraform.
*   **CI/CD:** Automating frontend and backend deployment/management via separate GitHub Actions workflows.
*   **Web Application Firewall (WAF):** Using AWS WAF with managed rules at the CloudFront edge.
*   **CloudFront Edge Logic:** Using CloudFront Functions to modify requests at the edge.
*   **Utility-First CSS:** Tailwind CSS approach for styling.
*   **Component-Based Architecture:** Standard React pattern for UI development.
*   **Remote State Pattern:** Using S3 backend for Terraform state storage and DynamoDB for state locking.
*   **OIDC:** Using OpenID Connect for temporary role assumption (for GHA deployment roles).
*   **Least Privilege:** IAM policies grant specific permissions (Lambda exec role; **backend deployment role needs refinement**).
*   **Terraform Workspaces:** Used to manage state for different environments.

## Component Relationships (MVP + Backend)

*   **Frontend (`/app`, `/components`):**
    *   `app/layout.tsx`: Root layout.
    *   `app/page.tsx`: Main page component.
    *   `components/*`: Reusable UI components.
    *   **(Future)** Will contain UI (e.g., form) making POST requests to the API Gateway endpoint (`/contact`).
*   **Backend (`/lambda_src`):**
    *   `lambda_src/src/index.ts`: Handles `APIGatewayProxyEvent`, validates input, writes to DynamoDB.
    *   Interacts with AWS SDK for DynamoDB.
    *   Receives table name via environment variable set by Terraform.
*   **API Gateway:**
    *   `aws_apigatewayv2_api.main_api`: Defines the HTTP API.
    *   `aws_apigatewayv2_route.contact_post_route`: Maps `POST /contact` to the Lambda integration.
    *   `aws_apigatewayv2_integration.lambda_integration`: Links the route to `aws_lambda_function.main_lambda`.
*   **Infrastructure (`/terraform`):**
    *   Defines relationships between API Gateway, Lambda, IAM Role, IAM Policy, and DynamoDB Table.
    *   Defines frontend infrastructure (S3, CloudFront, etc.).
    *   Uses `archive_file` data source referencing `/build/lambda_function.zip`.
*   **CI/CD (`.github/workflows`):**
    *   `deploy.yml`: Deploys frontend assets to S3, invalidates CloudFront.
    *   `deploy-backend.yml`: Builds Lambda, runs Terraform `plan`/`apply` to manage backend resources (Lambda, DynamoDB, APIGW, IAM) using OIDC auth and workspaces.

## Critical Implementation Paths

*   **User Request Flow (Production - Frontend):** User visits `robmclaughl.in` -> DNS (Route53) -> WAF -> CloudFront -> (Optional: CF Function rewrite) -> S3 Origin (OAC) -> Page Renders.
*   **User Request Flow (Preview - Frontend):** User visits `robmclaughl.in/branch/slug-1/` -> DNS -> WAF -> CloudFront -> CF Function rewrite -> S3 Origin (OAC) -> Page Renders.
*   **API Call Flow:** Client sends `POST` to `https://{api-gw-id}.execute-api.{region}.amazonaws.com/contact` -> API Gateway -> Triggers Lambda -> Lambda validates, writes to DynamoDB -> Lambda returns response -> API Gateway returns response to Client.
*   **Frontend Deployment Flow (Prod/Preview/Cleanup):** As defined via `deploy.yml`.
*   **Backend Deployment Flow (`master` push):** Push to `master` -> `deploy-backend.yml` triggers -> `deploy-prod` job runs -> Installs deps, builds Lambda package -> Assumes AWS Role via OIDC -> Terraform Init -> Select `prod` workspace -> Terraform Plan -> Terraform Apply -> AWS resources (Lambda, APIGW, etc.) created/updated.
*   **Backend Plan Flow (PR):** Push to PR branch -> `deploy-backend.yml` triggers -> `plan-staging` job runs -> Installs deps, builds Lambda package -> Assumes AWS Role via OIDC -> Terraform Init -> Select `dev` workspace -> Terraform Plan -> Plan output available for review (no apply).
*   **(Manual) Local Backend Deployment Flow:**
    1.  Developer modifies code in `/lambda_src`.
    2.  Developer runs `pnpm run package` in `/lambda_src`.
    3.  Developer runs `terraform workspace select <dev_or_prod>` in `/terraform`.
    4.  Developer runs `terraform apply` in `/terraform` directory.

## Data Management (MVP + Backend)

*   **Frontend Storage:** Static assets (HTML, CSS, JS) in AWS S3, accessed via CloudFront.
*   **Backend Storage:** Data posted via API Gateway is stored in AWS DynamoDB table (`robmclaughlin-{env}`).
    *   Managed via Terraform.
    *   Accessed by the Lambda function using AWS SDK.
*   **Caching:** CloudFront caches frontend assets. DynamoDB has its own caching options (DAX) if needed later. 
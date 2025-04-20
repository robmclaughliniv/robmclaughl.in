# Project Progress

*This document tracks the overall status of the project, what components are functional, what remains to be built, known issues, and the evolution of key decisions. **Updated: [Current Date + 5 Days]**.*

## Current Status (as of [Current Date + 5 Days])

*   Production site live at `robmclaughl.in`.
*   **Ephemeral Preview Environments implemented and operational:**
    *   GitHub Actions workflow successfully deploys PR branches to `.../branch/<slug>/`.
    *   Cleanup job removes environments on branch deletion.
    *   CloudFront Function correctly serves index files for preview URLs.
*   **AWS WAF operational:** Web ACL (`robmclaughl-in-waf-acl`) successfully created in `us-east-1` and associated with CloudFront via Terraform.
*   **(NEW) AWS Lambda & DynamoDB base infrastructure implemented:**
    *   Lambda function (`robmclaughlin-{env}-function`) created.
    *   DynamoDB table (`robmclaughlin-{env}`) created.
    *   IAM role and policy for Lambda-DynamoDB interaction created.
    *   All managed via Terraform in `/terraform` directory.
    *   Lambda source code structure exists in `/lambda_src`.
*   **Backend API implemented:**
    *   AWS Lambda function (`robmclaughlin-{env}-function`) with logic to validate POST data and write to DynamoDB.
    *   AWS DynamoDB table (`robmclaughlin-{env}`) operational.
    *   AWS API Gateway HTTP API (`robmclaughlin-{env}-http-api`) with `POST /contact` route triggering the Lambda.
    *   CORS configured on API Gateway.
    *   IAM permission for API Gateway to invoke Lambda created.
    *   All managed via Terraform in `/terraform` directory.
    *   Lambda source code (`/lambda_src`) contains handler logic.
*   **Backend CI/CD Workflow operational for production:**
    *   GitHub Actions workflow (`.github/workflows/deploy-backend.yml`) successfully handles Terraform `apply` for `master` branch (`prod` workspace) after resolving initial permission and state import issues.
    *   Handles Terraform `plan` for PRs (`dev` workspace).
*   **Local Development Environment Setup:**
    *   A documented process (`LOCAL_DEVELOPMENT.md`) exists for setting up a local Lambda/DynamoDB testing environment using LocalStack.
    *   Local testing of the Lambda function (via direct invocation simulating API Gateway) has been successful.
*   Previous items (security hardening, CSP fix, IaC setup, frontend CI/CD, UI components) remain complete.
*   **(NEW) Backend Preview Environments are now created:**
    *   `deploy-backend.yml` workflow successfully runs `terraform apply` on PRs.
    *   Creates backend resources (Lambda, DynamoDB, APIGW, etc.) in dynamic workspaces (e.g., `preview-<branch-name>`).
    *   Shared resources (S3, CF, WAF, ACM, Route53, IAM) are correctly skipped in preview workspaces due to conditional Terraform configuration (`count`).
*   **(NEW) Backend Cleanup Job Defined but NOT Triggering:**
    *   A `cleanup-backend-preview` job exists in `deploy-backend.yml` designed to destroy preview resources.
    *   The `on.delete` trigger is **not currently working**, so cleanup does not happen automatically.
*   **Production Deployment Resolved:** The `terraform apply` step in the production backend deployment job (`deploy-backend.yml`) is now functioning correctly after updating IAM permissions and importing existing resources (S3, ACM, CF, R53, IAM Role) into the `prod` workspace state.

## What Works

*   **Frontend:**
    *   Next.js project structure (App Router).
    *   Lo-fi themed UI with TailwindCSS and shadcn/ui.
    *   Responsive layout.
    *   Custom components: `CoffeeCup`, `Waveform`, `HeroBackground` (with video/image background, CRT effects, optimizations).
    *   Social links implemented.
*   **Backend (API & Infrastructure):**
    *   AWS Lambda function deployable via Terraform (requires manual build step *locally*, but automated in new CI/CD).
    *   Lambda handler validates POST JSON body (`{name, message}`) and writes item (`id`, `name`, `message`, `createdAt`) to DynamoDB.
    *   AWS DynamoDB table exists and receives data from Lambda.
    *   IAM permissions allow Lambda to write to DynamoDB.
    *   CloudWatch Log Group exists for Lambda, receiving logs.
    *   API Gateway HTTP API exists with `POST /contact` route.
    *   API Gateway successfully triggers the Lambda function.
    *   API Gateway CORS configuration allows requests from configured origins.
*   **Local Development/Testing:**
    *   LocalStack can be started to emulate Lambda and DynamoDB.
    *   Lambda function can be built, deployed locally, and invoked using `aws lambda invoke --endpoint-url`.
    *   Local DynamoDB table can be created and interacted with via `aws dynamodb --endpoint-url`.
    *   The documented local testing procedure (`LOCAL_DEVELOPMENT.md`) is functional.
*   **Infrastructure & Deployment:**
    *   Terraform scripts (`/terraform`) manage AWS resources (S3, CloudFront, Route53, ACM, WAF, Lambda, DynamoDB, IAM, **API Gateway**).
    *   GitHub Actions workflow for **frontend** CI/CD (`deploy.yml`) operational.
    *   GitHub Actions workflow for **backend** CI/CD (`deploy-backend.yml`) created, handles Terraform plan/apply for `dev`/`prod` workspaces using OIDC. **Production apply is now fixed.**
    *   Terraform workspaces (`dev`, `prod`) exist in S3 backend.
    *   Production frontend deployment to `robmclaughl.in`.
    *   Ephemeral frontend preview deployment to `robmclaughl.in/branch/<slug>/`.
    *   CloudFront Function (`append-index-html`) serving index files.
    *   Security measures (OAC, logging, security headers, OIDC, WAF, Lambda IAM).
    *   Automates Lambda build (`pnpm run package`).
    *   Authenticates to AWS using OIDC via `secrets.TERRAFORM_AWS_IAM_ROLE_ARN`.
*   **Local Development Setup:** Established and documented (`LOCAL_DEVELOPMENT.md`) a method for local Lambda/DynamoDB testing using LocalStack, preferring `aws --endpoint-url` and simulating API Gateway events for direct invocation ([Current Date + 4 Days]).
*   **Backend (API & Infrastructure - Production):**
    *   All resources (Lambda, DynamoDB, APIGW, IAM, etc.) managed by Terraform in `prod` workspace. Deployment is now functional.
    *   Lambda handler validates and writes data.
    *   API Gateway triggers Lambda.
*   **Backend (API & Infrastructure - Previews):**
    *   `deploy-backend.yml` workflow successfully **creates/updates** preview-specific backend resources (Lambda, DynamoDB, APIGW, IAM exec role) in dynamic workspaces via `terraform apply`.
*   **Infrastructure & Deployment (Preview):**
    *   Terraform scripts manage preview backend resources in dynamic workspaces.
    *   Frontend CI/CD (`deploy.yml`) operational for previews (S3 sync, CF invalidation).
    *   Backend CI/CD (`deploy-backend.yml`) operational for **deploying** previews (`terraform apply` in `preview-*` workspace).

## What's Left to Build / Next Steps

*   **Backend Cleanup Trigger:** **Fix the `on.delete` trigger** in `.github/workflows/deploy-backend.yml` so the `cleanup-backend-preview` job runs automatically when a branch is deleted.
*   **Frontend-Backend Integration:** Implement frontend form to call the `/contact` API.
*   **Testing:** Implement Cypress UI tests and potentially Lambda tests.
*   **Infrastructure & Security:**
    *   (Optional) Further refine IAM permissions for the backend deployment role (`TERRAFORM_AWS_IAM_ROLE_ARN`) if desired beyond the recent additions.
*   **Content & Refinement:** Ongoing UI/UX/performance improvements.

## Known Issues & Bugs

*   **Critical:** **Backend Preview Cleanup Not Triggering:** The `cleanup-backend-preview` job in `deploy-backend.yml` does not run when a branch is deleted due to issues with the `on.delete` trigger configuration.
*   **Integration:** Frontend does not yet call the backend API.
*   *(Minor)* Baseline UI/Lambda tests not implemented.
*   *(Minor)* CloudFront Function `append-index-html` is managed manually.
*   *(Minor)* Local Lambda deployment requires manual `pnpm run package` (automated in CI/CD).
*   **(RESOLVED - [Current Date + 5 Days])** Production `terraform apply` failure in `deploy-backend.yml` after merging conditional resource logic. Resolved by adding WAF/ACM permissions to backend OIDC role and importing existing S3, ACM, CF, R53, Frontend IAM Role into `prod` Terraform state.
*   **Backend Cleanup Strategy:** Defined `cleanup-backend-preview` job to run `terraform destroy` on branch delete, but the trigger mechanism is currently non-functional ([Current Date + 4 Days]).
*   **Production Deployment Fix ([Current Date + 5 Days]):** Resolved `terraform apply` failures in the `prod` workspace after merging conditional resource logic. Required adding WAF/ACM permissions to the backend OIDC role and importing existing production resources (S3, ACM, CF, R53, Frontend IAM Role) into the `prod` Terraform state as they weren't tracked previously.

## Recent Terraform Improvements (Lambda/DynamoDB Setup)

*   **File Organization:** Moved Lambda/DynamoDB Terraform config from root to `/terraform` directory (`lambda_dynamodb.tf`, etc.) for consistency.
*   **Dependency Management:** Added `archive_file` data source to manage Lambda zip dependency.
*   **Path Adjustments:** Corrected `source_dir` and `output_path` in `archive_file` to be relative to the `/terraform` directory (`../lambda_src/dist`, `../build/lambda_function.zip`).
*   **Configuration Cleanup:** Removed duplicate `terraform` and `provider` blocks from `lambda_dynamodb.tf`.
*   **State Management:** Used `terraform import` to resolve `EntityAlreadyExists` errors for pre-existing IAM role and policy.

## Content Security Policy Resolution (April 5, 2025)

*   A post-deployment issue ("flash then black screen") was traced to the Content Security Policy (CSP) set via CloudFront Response Headers Policy.
*   The `script-src 'self'` directive was blocking essential inline scripts used by Next.js for hydration and functionality.
*   The issue was resolved by modifying the CSP in Terraform (`terraform/modules/cloudfront/main.tf`) to include `'unsafe-inline'` in the `script-src` directive (`script-src 'self' 'unsafe-inline';`).
*   This allows the site to function correctly but represents a trade-off, reducing protection against potential XSS attacks involving inline scripts.

## Recent Security Improvements (April 4, 2025)

*   **CloudFront:**
    *   Migrated from Origin Access Identity (OAI) to Origin Access Control (OAC) for S3 origin access.
    *   Enabled access logging to a dedicated S3 bucket.
    *   Implemented a Response Headers Policy with security headers (HSTS, CSP, X-Content-Type-Options, etc.).
*   **IAM & Deployment:**
    *   Removed unnecessary `s3:PutObjectAcl` permission from the GitHub Actions IAM role.
    *   Updated GitHub Actions workflow to use pnpm (matching local development) and removed redundant `--acl private` flag.
*   **Terraform:**
    *   Enabled S3 backend with DynamoDB locking for secure and reliable state management.

## Recent Terraform Improvements (April 4, 2025)

*   **Route53 Record Management:**
    *   Fixed issue with Terraform trying to create Route53 records that already existed.
    *   Corrected Zone ID from `Z2PPIVE6CKK74TX` to `Z2PPIVE6CKK74T` in the Terraform configuration.
    *   Added `allow_overwrite = true` to Route53 record resources to allow Terraform to manage existing records.
    *   Re-enabled ACM validation resources with proper provider configuration.
    *   Successfully imported existing Route53 records into Terraform state.

## Decision Log / Evolution

*   Project follows a phased approach (MVP first, then expansion). See `projectbrief.md`.
*   Progress tracking moved from root to `docs/PROGRESS.md`.
*   Adopted Next.js App Router, TailwindCSS, shadcn/ui, Terraform, AWS (S3/CloudFront), and GitHub Actions as key technologies. See `techContext.md` and `systemPatterns.md`.
*   Emphasis on Infrastructure as Code (Terraform) and automated CI/CD from the start.
*   Security improvements implemented based on post-launch security review.
*   Adjusted CloudFront Content Security Policy (`script-src`) to include `'unsafe-inline'` to ensure compatibility with Next.js inline scripts (April 5, 2025).
*   **Implemented Ephemeral Previews:** Added multi-job workflow (prod, preview, cleanup), used Next.js `basePath`, S3 prefixes, Repository Secrets, and CloudFront Function for index files ([Current Date]).
*   **Implemented AWS WAF:** Added `aws_wafv2_web_acl` resource in Terraform (configured in `us-east-1`), associated with CloudFront, using `AWSManagedRulesCommonRuleSet` and `AWSManagedRulesAmazonIpReputationList` ([Current Date]).
*   **Production Branch:** Confirmed and updated workflow to use `master` branch ([Current Date]).
*   **Added Backend Components:** Introduced AWS Lambda and DynamoDB via Terraform to support future dynamic features ([Current Date + 1 Day]).
*   **Terraform Structure:** Decided to keep Lambda/DynamoDB config in separate files (`lambda_dynamodb.tf`, etc.) within the `/terraform` directory for modularity ([Current Date + 1 Day]).
*   **Lambda Build Process:** Adopted Node.js script (`zip.js` with `archiver`) for packaging due to cross-platform issues with system `
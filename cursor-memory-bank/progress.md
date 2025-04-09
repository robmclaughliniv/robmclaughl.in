# Project Progress

*This document tracks the overall status of the project, what components are functional, what remains to be built, known issues, and the evolution of key decisions.*

## Current Status (as of [Current Date + 2 Days])

*   Production site live at `robmclaughl.in`.
*   **Ephemeral Preview Environments implemented and operational:**
    *   GitHub Actions workflow successfully deploys PR branches to `.../branch/<slug>/`.
    *   Cleanup job removes environments on branch deletion.
    *   CloudFront Function correctly serves index files for preview URLs.
*   **AWS WAF implemented:** Web ACL with managed rules associated with CloudFront via Terraform.
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
*   **Backend CI/CD Workflow implemented:**
    *   GitHub Actions workflow (`.github/workflows/deploy-backend.yml`) created.
    *   Handles Terraform `plan` for PRs (`dev` workspace) and `apply` for `master` branch (`prod` workspace).
    *   Uses OIDC for AWS authentication (`secrets.TERRAFORM_AWS_IAM_ROLE_ARN`).
    *   Includes Lambda build step (`pnpm run package`).
*   Previous items (security hardening, CSP fix, IaC setup, frontend CI/CD, UI components) remain complete.

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
*   **Infrastructure & Deployment:**
    *   Terraform scripts (`/terraform`) manage AWS resources (S3, CloudFront, Route53, ACM, WAF, Lambda, DynamoDB, IAM, **API Gateway**).
    *   GitHub Actions workflow for **frontend** CI/CD (`deploy.yml`) operational.
    *   GitHub Actions workflow for **backend** CI/CD (`deploy-backend.yml`) created, handles Terraform plan/apply for `dev`/`prod` workspaces using OIDC.
    *   Terraform workspaces (`dev`, `prod`) exist in S3 backend.
    *   Production frontend deployment to `robmclaughl.in`.
    *   Ephemeral frontend preview deployment to `robmclaughl.in/branch/<slug>/`.
    *   CloudFront Function (`append-index-html`) serving index files.
    *   Security measures (OAC, logging, security headers, OIDC, WAF, Lambda IAM).

## What's Left to Build / Next Steps

*   **Frontend-Backend Integration:**
    *   Implement frontend form (e.g., a contact form) to POST data to the `/contact` API Gateway endpoint.
*   **Testing:**
    *   Implement baseline UI tests using Cypress.
    *   Consider adding tests for the Lambda function logic.
*   **Infrastructure & Security:**
    *   **Refine IAM permissions for the backend deployment role (`TERRAFORM_AWS_IAM_ROLE_ARN`)**. Replace broad `FullAccess` policies with least-privilege custom policies.
    *   Manage the CloudFront Function (`append-index-html`) via Terraform.
    *   *(Lower Priority)* Automate the *local* Lambda build/package step if needed outside CI/CD.
*   **Content & Refinement:**
    *   Ongoing performance monitoring and optimization.
    *   Further UI/UX enhancements.
*   **Future Phases (Post-MVP):**
    *   Add analytics.
    *   Consider blog functionality.
    *   Implement more dynamic content using Lambda/DynamoDB/API Gateway.

## Known Issues & Bugs

*   **Security:** The IAM Role used by the backend deployment workflow (`TERRAFORM_AWS_IAM_ROLE_ARN`) currently has overly broad permissions (e.g., `IAMFullAccess`) and needs refinement.
*   **Integration:** Frontend does not yet call the backend API Gateway endpoint.
*   *(Minor)* Lambda deployment locally requires a manual `pnpm run package` step before `terraform apply` (automated in CI/CD).
*   *(Minor)* Baseline UI tests are not yet implemented.
*   *(Minor)* Lambda tests are not implemented.
*   *(Minor)* CloudFront Function `append-index-html` is managed manually outside of Terraform.

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
*   **Lambda Build Process:** Adopted Node.js script (`zip.js` with `archiver`) for packaging due to cross-platform issues with system `zip` command ([Current Date + 1 Day]).
*   **Lambda Deployment:** Currently requires manual build step before Terraform apply ([Current Date + 1 Day]).
*   **State Reconciliation:** Used `terraform import` to align Terraform state with existing AWS resources ([Current Date + 1 Day]).
*   **Implemented API Trigger:** Added an AWS API Gateway HTTP API (`POST /contact`) via Terraform to invoke the Lambda function ([Current Date + 2 Days]).
*   **Implemented Lambda Logic:** Updated Lambda handler (`index.ts`) to parse/validate POST body and write to DynamoDB ([Current Date + 2 Days]).
*   **Added Backend CI/CD:** Created a separate GitHub Actions workflow (`deploy-backend.yml`) for managing Terraform apply for backend resources. Uses OIDC for authentication and Terraform workspaces (`dev`/`prod`) ([Current Date + 2 Days]).
*   **Authentication Choice:** Opted for OIDC over static API keys for the backend deployment workflow due to enhanced security ([Current Date + 2 Days]).
*   **Manual Step:** Acknowledged the OIDC IAM Role for the backend workflow requires manual creation outside the primary Terraform apply ([Current Date + 2 Days]). 
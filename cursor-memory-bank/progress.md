# Project Progress

*This document tracks the overall status of the project, what components are functional, what remains to be built, known issues, and the evolution of key decisions.*

## Current Status (as of [Current Date])

*   Production site live at `robmclaughl.in`.
*   **Ephemeral Preview Environments implemented and operational:**
    *   GitHub Actions workflow successfully deploys PR branches to `.../branch/<slug>/`.
    *   Cleanup job removes environments on branch deletion.
    *   CloudFront Function correctly serves index files for preview URLs.
*   **AWS WAF implemented:** Web ACL with managed rules associated with CloudFront via Terraform.
*   Previous items (security hardening, CSP fix, IaC setup, CI/CD pipeline, UI components) remain complete.

## What Works

*   **Frontend:**
    *   Next.js project structure (App Router).
    *   Lo-fi themed UI with TailwindCSS and shadcn/ui.
    *   Responsive layout.
    *   Custom components: `CoffeeCup`, `Waveform`, `HeroBackground` (with video/image background, CRT effects, optimizations).
    *   Social links implemented.
*   **Infrastructure & Deployment:**
    *   Terraform scripts for AWS resources (S3, CloudFront, Route53, ACM, IAM Role, S3 Lifecycle Rule).
    *   GitHub Actions workflow for CI/CD (`deploy-prod`, `deploy-preview`, `cleanup-preview`) operational.
    *   Production deployment to `robmclaughl.in`.
    *   Ephemeral preview deployment to `robmclaughl.in/branch/<slug>/` including PR comments and cleanup.
    *   S3 Lifecycle Rule for cleaning up old preview branches.
    *   CloudFront Function (`append-index-html`) serving index files.
    *   Security measures (OAC, logging, security headers, OIDC).
    *   AWS WAF with managed rules filtering CloudFront traffic.

## What's Left to Build / Next Steps

*   **Testing:**
    *   Implement baseline UI tests using Cypress.
*   **Content & Refinement:**
    *   Ongoing performance monitoring and optimization.
    *   Further UI/UX enhancements (e.g., light/dark mode toggle).
*   **Infrastructure:**
    *   Consider managing the CloudFront Function (`append-index-html`) via Terraform for full IaC coverage (currently manual).
*   **Future Phases (Post-MVP):**
    *   Add analytics (optional).
    *   Consider blog functionality.
    *   Implement dynamic content or advanced features.

## Known Issues & Bugs

*   Baseline UI tests are not yet implemented.
*   Content may require ongoing refinement based on feedback or evolving requirements.
*   CloudFront Function `append-index-html` is managed manually outside of Terraform.

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
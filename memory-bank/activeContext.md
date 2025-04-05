# Active Context

*This document tracks the current focus, recent activities, immediate next steps, and important decisions or patterns relevant to the ongoing work. It's a snapshot of the project's current state. **Updated: April 4, 2025 (Post-Launch)**.*

## Current Focus

*   **Primary:** Polishing the homepage UI to achieve a retro-futuristic CRT monitor aesthetic.
*   **Long-term Vision:** Evolve the page into a "lofi vibe generator" inspired by lofi.cafe, featuring:
    *   An integrated audio player.
    *   AI-driven visuals.
    *   Clickable "channels" to change music and visuals.
    *   Links/elements connecting to subdomains showcasing web experiments.

## Recent Changes (Since March 23, 2025)

*   Successful initial deployment of the site to `robmclaughl.in`.
*   Refined the CRT visual effects applied to the background video component (`HeroBackground`).
*   Implemented security improvements following post-launch security review.
*   Fixed Terraform Route53 record management issue by correcting Zone ID and adding `allow_overwrite = true` parameter.
*   (Previous changes before March 23rd included initial prototype, component implementation, Terraform setup, CI/CD pipeline setup).

## Immediate Next Steps

1.  **✅ Post-Launch Security Review:** Completed. Security improvements implemented:
    * Migrated from CloudFront OAI to OAC for S3 origin access
    * Enabled CloudFront access logging to a dedicated S3 bucket
    * Added CloudFront Response Headers Policy with security headers (HSTS, CSP, etc.)
    * Removed unnecessary S3 permissions from IAM role
    * Updated GitHub Actions workflow to use pnpm and removed redundant flags
    * Enabled S3 backend for Terraform state
2.  **Next: Baseline Testing:** Implement basic functional UI tests using Cypress.

## Active Decisions & Considerations

*   **No Analytics:** Analytics implementation is deferred.
*   **No Dark Mode (Yet):** A theme toggle is not an immediate priority.
*   **No Blog:** Blog functionality is out of scope for the current focus.
*   **Core Focus:** Prioritize development of the "lofi vibe generator" concept and creating a space to showcase web experiments.

## Key Patterns & Preferences

*   Continue leveraging Next.js SSG, TailwindCSS, and shadcn/ui components.
*   Maintain clean code and adhere to IaC principles with Terraform.
*   Ensure deployment pipeline remains automated and secure (OIDC).
*   Prioritize performance and responsiveness.

## Learnings & Insights (Recent)

*   Security best practices for AWS static site hosting include using OAC instead of OAI, implementing security headers, and enabling access logging.
*   Refining CRT effects requires careful tuning of CSS filters, overlays, and potentially shaders for optimal visual appeal and performance.
*   When managing existing AWS resources with Terraform:
    * Ensure Zone IDs and other resource identifiers are exactly correct (e.g., `Z2PPIVE6CKK74T` vs. `Z2PPIVE6CKK74TX`).
    * Use `allow_overwrite = true` for Route53 records to allow Terraform to manage pre-existing DNS records.
    * Properly configure S3 backend for state management to ensure consistent state across deployments.
*   (Previous learnings included `HeroBackground` optimizations and IaC/CI/CD setup benefits).

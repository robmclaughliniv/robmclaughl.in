# Active Context

*This document tracks the current focus, recent activities, immediate next steps, and important decisions or patterns relevant to the ongoing work. It's a snapshot of the project's current state. **Updated: [Current Date + 4 Days]**.*

## Current Focus

*   **Primary:** Debug the GitHub Actions trigger (`on.delete`) for the `cleanup-backend-preview` job in `deploy-backend.yml` to ensure backend preview resources are automatically destroyed when their corresponding branch is deleted.
*   **Secondary:** Integrate the backend API (`POST /contact`) with the frontend application.
*   **Tertiary:** Refine IAM permissions for the backend deployment role (`TERRAFORM_AWS_IAM_ROLE_ARN`).
*   **(Recently Completed):** Successfully implemented `terraform apply` for backend preview environments in the `deploy-backend-preview` job.
*   **(Recently Completed):** Refactored `terraform/main.tf` to make shared resources (S3, ACM, WAF, CloudFront, Route53, IAM Role) conditional, creating them only in the `prod` workspace.

## Recent Changes (Since LocalStack Setup)

*   **Added `terraform apply` to Backend Preview Job:** Modified the `plan-staging` job (renamed to `deploy-backend-preview`) in `deploy-backend.yml` to run `terraform apply -auto-approve tfplan`, creating actual AWS resources (Lambda, DynamoDB, APIGW) for PR branches.
*   **Implemented Dynamic Workspaces:** The `deploy-backend-preview` job now uses Terraform workspaces named dynamically based on the sanitized branch name (e.g., `preview-<branch-name>`).
*   **Added Backend Cleanup Job (Definition):** Defined a `cleanup-backend-preview` job in `deploy-backend.yml` with steps to run `terraform destroy` and `terraform workspace delete` for the corresponding preview workspace.
*   **Attempted Delete Trigger Configs:** Tried several configurations for the `on.delete` trigger in `deploy-backend.yml` to activate the `cleanup-backend-preview` job (currently set to `on: delete:` with filtering in the job's `if` condition).
*   **Made Terraform Resources Conditional:** Updated `terraform/main.tf` to use `count = terraform.workspace == "prod" ? 1 : 0` for shared resources (S3 buckets, ACM, WAF, CloudFront, Route53, IAM role) and their dependencies/outputs, preventing conflicts in preview workspaces.
*   *(Previous changes: S3 Module Refactor, LocalStack Setup, API Implementation, Backend CI/CD Workflow creation, Terraform Workspaces)*

## Immediate Next Steps

1.  ✅ CloudFront Subdirectory Index Handling Implemented.
2.  ✅ AWS WAF Implementation via Terraform.
3.  ✅ Lambda & DynamoDB Base Setup via Terraform.
4.  ✅ Lambda Handler Logic Implemented (`index.ts`).
5.  ✅ API Gateway Trigger Implemented (`api_gateway.tf`).
6.  ✅ Backend Deployment Workflow Created (`deploy-backend.yml`).
7.  ✅ Terraform Workspaces Created (`dev`, `prod`).
8.  ✅ Terraform S3 Module Refactoring to fix CI/CD plan errors.
9.  ✅ Setup and documentation of local Lambda/DynamoDB testing environment using LocalStack (`LOCAL_DEVELOPMENT.md`).
10. ✅ **(Completed)** Implemented `terraform apply` for backend previews in `deploy-backend.yml`.
11. ✅ **(Completed)** Made shared Terraform resources (S3, ACM, WAF, etc.) conditional on `prod` workspace in `main.tf`.
12. 🟡 **(In Progress/Blocked)** Backend Cleanup Job (`cleanup-backend-preview` in `deploy-backend.yml`) defined but **trigger (`on.delete`) is not working correctly.**
13. **Next: Debug Delete Trigger:** Investigate why the `on.delete` trigger in `deploy-backend.yml` isn't activating the `cleanup-backend-preview` job.
14. **Next: Frontend Integration:** Build UI element (e.g., contact form) to call the `POST /contact` API endpoint.
15. **Next: Refine IAM Permissions:** Create custom, least-privilege IAM policy for the backend deployment role.
16. **Next: Baseline Testing:** Implement basic functional UI tests using Cypress.
17. **(Manual Task)** Create/Update OIDC IAM Role in AWS (`TERRAFORM_AWS_IAM_ROLE_ARN`) with necessary permissions (including WAF/ACM) and configure secret in GitHub.

## Active Decisions & Considerations

*   **Preview Environment Resources:** Backend previews (Lambda, DynamoDB, APIGW) **will** be created via `terraform apply` in branch-specific workspaces. Shared resources (S3, CF, WAF, ACM, Route53, IAM) **will not** be created in preview workspaces.
*   **Cleanup Strategy:** Intention is to automatically destroy preview backend resources via `terraform destroy` triggered by branch deletion. **(Currently blocked by trigger issue)**.
*   **Terraform Structure:** Using conditional `count` based on `terraform.workspace` in `main.tf` to manage shared vs. environment-specific resources.
*   *(Previous decisions: Backend Deployment Strategy, Auth, Manual Setup, Local Testing, etc.)*

## Key Patterns & Preferences

*   Automate infrastructure deployment using Terraform and GitHub Actions (`apply` for previews, `destroy` for cleanup).
*   Use dynamic Terraform workspaces (`preview-<branch-name>`) for backend previews.
*   Use conditional resource creation (`count`) in Terraform to manage shared infrastructure vs. per-environment components.
*   *(Previous patterns: OIDC, Separate Workflows, API Gateway, Utility CSS, SSG etc.)*

## Learnings & Insights (Recent - Backend Previews & Cleanup Attempts)

*   The `terraform apply` command can be successfully integrated into a PR workflow to create ephemeral backend resources.
*   Using `count = terraform.workspace == "prod" ? 1 : 0` is an effective pattern for managing shared resources that should only exist in production. Remember to update references using `[0]` index.
*   The GitHub Actions `on.delete` trigger might have nuances or syntax requirements that aren't immediately obvious or behave inconsistently; relying on job-level `if` conditions for filtering seems more robust if trigger-level filtering causes issues. **(Still requires debugging)**.
*   Ensure the IAM role assumed by Terraform has permissions for *all* actions Terraform might perform in *any* workspace (e.g., WAF/ACM actions even if those resources are conditional, as Terraform might still read them).
*   *(Previous learnings: Terraform dependencies, OIDC setup, API Gateway V2, LocalStack nuances etc.)* 
# Active Context

*This document tracks the current focus, recent activities, immediate next steps, and important decisions or patterns relevant to the ongoing work. It's a snapshot of the project's current state. **Updated: [Current Date + 3 Days]**.*

## Current Focus

*   **Primary:** Integrate the newly created backend API (`POST /contact`) with the frontend application. This involves creating a form or mechanism on the website to send data to the API Gateway endpoint.
*   **Secondary:** Refine IAM permissions for the new backend deployment role (`TERRAFORM_AWS_IAM_ROLE_ARN`) to follow the principle of least privilege.
*   **Tertiary (Recently Completed):** Resolved Terraform plan errors in GitHub Actions related to S3 module dependencies by refactoring the module (`./modules/s3`) and root configuration (`main.tf`).
*   **Quaternary (Recently Completed):** Established and documented a local development/testing environment for the Lambda function and DynamoDB using LocalStack (`LOCAL_DEVELOPMENT.md`). Successfully tested local invocation.
*   **Next:**
    *   Implement baseline UI tests using Cypress, potentially including a test for the frontend-backend interaction.

## Recent Changes (Since Lambda/DynamoDB Setup)

*   **Refactored Terraform S3 Module:** Modified `./modules/s3` to use an explicit `create_bucket` variable instead of deriving logic from `cloudfront_distribution_arn`. Moved the OAC S3 bucket policy definition from the module to the root `main.tf` to resolve plan-time dependency errors in CI/CD.
*   **Implemented Lambda Handler Logic:** Updated `lambda_src/src/index.ts` to handle `APIGatewayProxyEvent`, parse JSON body, validate `name` and `message` fields, and write a record to DynamoDB using AWS SDK v3.
*   **Implemented API Gateway Trigger:** Added Terraform configuration (`terraform/api_gateway.tf`) to create an API Gateway HTTP API with a `POST /contact` route triggering the Lambda function. Configured CORS and Lambda invocation permissions.
*   **Added Backend CI/CD Workflow:** Created `.github/workflows/deploy-backend.yml`.
    *   Triggers on `master` push/PR and manual dispatch.
    *   Uses separate jobs for `plan-staging` (PRs, `dev` workspace) and `deploy-prod` (`master`, `prod` workspace).
    *   Automates Lambda build (`pnpm run package`).
    *   Authenticates to AWS using OIDC via `secrets.TERRAFORM_AWS_IAM_ROLE_ARN`.
*   **Created Terraform Workspaces:** Established `dev` and `prod` workspaces in the S3 backend via `terraform workspace new`.
*   **Identified Need for Manual Role Creation:** Confirmed the OIDC IAM role (`TERRAFORM_AWS_IAM_ROLE_ARN`) needs to be created manually in AWS before the workflow can run.

## Immediate Next Steps

1.  ✅ CloudFront Subdirectory Index Handling Implemented.
2.  ✅ AWS WAF Implementation via Terraform.
3.  ✅ Lambda & DynamoDB Base Setup via Terraform.
4.  ✅ Lambda Handler Logic Implemented (`index.ts`).
5.  ✅ API Gateway Trigger Implemented (`api_gateway.tf`).
6.  ✅ Backend Deployment Workflow Created (`deploy-backend.yml`).
7.  ✅ Terraform Workspaces Created (`dev`, `prod`).
8.  ✅ **(Completed)** Terraform S3 Module Refactoring to fix CI/CD plan errors.
9.  ✅ **(Completed)** Setup and documentation of local Lambda/DynamoDB testing environment using LocalStack (`LOCAL_DEVELOPMENT.md`).
10. **(Manual Task)** Create OIDC IAM Role in AWS and configure `TERRAFORM_AWS_IAM_ROLE_ARN` secret in GitHub.
11. **Next: Frontend Integration:** Build UI element (e.g., contact form) to call the `POST /contact` API endpoint.
12. **Next: Refine IAM Permissions:** Create custom, least-privilege IAM policy for the backend deployment role.
13. **Next: Baseline Testing:** Implement basic functional UI tests using Cypress.

## Active Decisions & Considerations

*   **Terraform Structure:** Root module (`main.tf`) orchestrates calls to other modules (s3, cloudfront, acm, etc.) and defines resources like WAF ACL and the S3 OAC bucket policy.
*   **S3 Module Design:** `./modules/s3` is designed to conditionally create S3 resources based on the `create_bucket` input variable.
*   **Backend Deployment Strategy:** Dedicated GitHub Actions workflow (`deploy-backend.yml`) using Terraform workspaces (`dev`/`prod`) and OIDC authentication.
*   **Authentication:** OIDC preferred over static API keys for CI/CD workflows.
*   **Manual Setup:** The initial OIDC role for the deployment workflow requires manual creation due to the chicken-and-egg problem with Terraform permissions.
*   **IAM Permissions (Temporary):** Using broader managed policies initially for the OIDC role, with the explicit requirement to refine them post-setup.
*   **Local Testing:** Utilize LocalStack for emulating Lambda/DynamoDB. Invoke Lambda locally using `aws lambda invoke --endpoint-url...` with a payload simulating the API Gateway event structure (`event.body`). Prefer `aws --endpoint-url` over `awslocal` due to stability issues.
*   (Previous decisions: Lambda/DynamoDB Management, Lambda Source Location, Packaging, etc.).

## Key Patterns & Preferences

*   Automate infrastructure deployment using Terraform and GitHub Actions.
*   Use OIDC for secure authentication between GitHub Actions and AWS.
*   Employ Terraform workspaces to manage different environments (`dev`, `prod`).
*   Separate CI/CD workflows for frontend (`deploy.yml`) and backend (`deploy-backend.yml`).
*   Handle Lambda code validation and database interaction within the Lambda handler.
*   Use API Gateway as the HTTP frontend for Lambda functions.
*   **Decouple Terraform resources to avoid plan-time dependency errors, managing dependent resources (like bucket policies needing ARNs) at a higher level in the configuration.**
*   **Simulate API Gateway event structure (`event.body`) when invoking Lambda directly for local testing.**
*   (Previous patterns: Next.js SSG, Tailwind, IaC, etc.).

## Learnings & Insights (Recent - API, CI/CD, Terraform Refactor, LocalStack)

*   Terraform `count` arguments cannot depend on values unknown until the apply phase. Refactoring modules to use explicit boolean inputs for conditional creation and defining dependent resources (like policies) at the root level resolves these issues.
*   GitHub Actions workflows require credentials *before* Terraform can run, necessitating manual creation of the initial OIDC role Terraform will use.
*   OIDC provides a secure alternative to storing long-lived AWS keys in GitHub Secrets.
*   Separating backend deployment into its own workflow improves clarity and separation of concerns.
*   API Gateway V2 (HTTP API) provides a simpler, cheaper alternative to REST APIs for basic Lambda integrations.
*   Terraform workspaces are effective for managing state across different deployment environments (dev/staging vs. production).
*   Windows long path limitations can interfere with `pip install` for packages with deep directory structures; enabling Win32 long path support is the standard fix.
*   The `awslocal` wrapper can be unstable in some terminal environments (e.g., Git Bash on Windows); using `aws --endpoint-url=...` directly is more reliable.
*   Direct `aws lambda invoke` passes the payload as the root `event` object. If Lambda code expects an API Gateway structure, the payload must be wrapped (e.g., `{"body": "..."}`) to simulate the expected input. 
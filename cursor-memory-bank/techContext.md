# Technical Context

*This document details the technologies used in the project, development environment setup, technical constraints, dependencies, and specific tool usage patterns.*

## Technology Stack

*   **Frontend:** Next.js 13 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui components.
*   **Backend:** AWS Lambda (Node.js 20.x runtime, TypeScript), AWS DynamoDB (On-Demand).
*   **Infrastructure:** AWS (S3, CloudFront, Route 53, ACM, Lambda, DynamoDB, IAM, CloudWatch Logs). Infrastructure as Code managed by Terraform.
*   **Security:** AWS WAFv2 (associated with CloudFront), IAM Roles/Policies.
*   **CI/CD:** GitHub Actions (for frontend deployment).
*   **Packaging:** `archiver` Node.js package (for Lambda deployment zip).
*   **Other Key Technologies:** AWS CLI.

## Development Environment Setup

*   **Core Tools:** Node.js, pnpm (`v10.7.1` used locally and in CI).
*   **Frontend Setup:** Clone repo, run `pnpm install` in root. Run with `pnpm run dev`.
*   **Backend (Lambda) Setup:**
    *   Navigate to `/lambda_src`.
    *   Run `pnpm install`.
    *   Run `pnpm run package` to build TypeScript and create `/build/lambda_function.zip`.
*   **Terraform Setup:**
    *   Navigate to `/terraform`.
    *   Run `terraform init`.
    *   Use `terraform workspace select <name>` (e.g., `default` for dev, `prod`).
    *   Run `terraform plan` and `terraform apply`.
*   **Environment Variables:**
    *   `BASE_PATH`: Used during frontend `deploy-preview` CI job.
    *   `DYNAMODB_TABLE_NAME`: Set automatically for Lambda function by Terraform.

## Technical Constraints

*   **MVP Focus:** Initial build is a minimal single-page application, Lambda/DynamoDB added for future use.
*   **Performance:** Frontend must load quickly. Lambda performance considerations (cold starts, memory).
*   **Responsiveness:** Frontend must work well across devices.
*   **Security:** HTTPS, OAC, OIDC, WAF, Security Headers, Least Privilege IAM for Lambda.
*   **Manual Lambda Build Step:** Requires `pnpm run package` in `/lambda_src` before `terraform apply` can deploy Lambda updates.

## Key Dependencies

*   **Framework:** Next.js (`^15.1.0`), React (`^18.2.0`).
*   **Styling:** Tailwind CSS (`^3.4.17`), etc.
*   **Components:** `@radix-ui/*`, `shadcn/ui`.
*   **Backend SDK:** `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` (in `/lambda_src`).
*   **Backend Dev:** `typescript`, `@types/aws-lambda`, `@types/node`, `archiver`, `@types/archiver` (in `/lambda_src`).
*   **Infrastructure:** Terraform (`~> 5.0` for AWS provider, `~> 2.2` for archive provider).
*   **Deployment:** GitHub Actions.

## Tool Usage & Conventions

*   **Version Control:** Git, GitHub. Branch: `master` for production.
*   **Package Manager:** `pnpm` (`v10.7.1`).
*   **Linters/Formatters:** Standard TypeScript/Next.js setup.
*   **Testing:** Cypress planned next.
*   **Build Process:**
    *   Frontend: `pnpm run build` in root (via GHA).
    *   Backend: `pnpm run package` in `/lambda_src` (manual step before Terraform apply).
*   **Deployment:**
    *   Frontend: Automated via GitHub Actions (`.github/workflows/deploy.yml`).
    *   Backend (Lambda/DynamoDB/IAM): Via `terraform apply` in `/terraform` directory (manual trigger).
*   **Terraform Configuration (`/terraform`):**
    *   Manages all AWS resources (Frontend: S3, CloudFront, etc.; Backend: Lambda, DynamoDB, IAM).
    *   Uses workspaces for environments (`dev`, `prod`).
    *   Configuration split into logical files (e.g., `main.tf`, `lambda_dynamodb.tf`).
    *   Uses S3 backend with DynamoDB locking.
    *   Relies on `archive_file` data source using the zip file created by the Lambda build process.
    *   Handles existing resources via `terraform import` when necessary.
*   **CloudFront Function:** `append-index-html` (manual creation, needs update). // TODO: Manage via Terraform 
# Active Context

*This document tracks the current focus, recent activities, immediate next steps, and important decisions or patterns relevant to the ongoing work. It's a snapshot of the project's current state. **Updated: [Current Date + 1 Day]**.*

## Current Focus

*   **Primary:** Polishing the homepage UI to achieve a retro-futuristic CRT monitor aesthetic (effects restored).
*   **Secondary:** Utilizing and refining the AWS platform, including the newly added Lambda/DynamoDB infrastructure.
*   **Next:**
    *   Implement baseline UI tests using Cypress.
    *   Potentially define a trigger (e.g., API Gateway) for the new Lambda function.
*   **Long-term Vision:** Evolve the page into a "lofi vibe generator" inspired by lofi.cafe, featuring:
    *   An integrated audio player.
    *   AI-driven visuals.
    *   Clickable "channels" to change music and visuals.
    *   Links/elements connecting to subdomains showcasing web experiments.
    *   Potential use of Lambda/DynamoDB for dynamic features (e.g., saving preferences, simple API).

## Recent Changes (Since AWS WAF Implementation)

*   **(NEW) Implemented AWS Lambda & DynamoDB via Terraform:**
    *   Added Terraform configuration (`terraform/lambda_dynamodb.tf`, `terraform/variables_lambda_dynamodb.tf`, `terraform/outputs_lambda_dynamodb.tf`) to manage:
        *   An AWS Lambda function written in TypeScript (source in `/lambda_src`).
        *   A DynamoDB table (`robmclaughlin-{env}`) with on-demand capacity.
        *   The necessary IAM role (`robmclaughlin-{env}-lambda-exec-role`) and policy (`robmclaughlin-{env}-dynamodb-write-policy`) for the Lambda to write to the DynamoDB table.
        *   A CloudWatch Log Group for the Lambda function.
    *   Created Lambda source structure (`/lambda_src`) with `package.json`, `tsconfig.json`, `src/index.ts` (placeholder handler), and `zip.js` (Node.js script using `archiver` for packaging).
    *   Uses Terraform workspaces (`dev`/`prod`) for environment differentiation.
    *   Required `pnpm install` and `pnpm run package` in `/lambda_src` before `terraform apply`.
    *   Resolved `EntityAlreadyExists` errors during `terraform apply` by importing the pre-existing IAM role and policy using `terraform import`.
    *   Resolved `Duplicate provider configuration` errors by removing redundant `terraform` and `provider` blocks from `lambda_dynamodb.tf`.
*   (Previous changes: WAF, Preview Env setup & troubleshooting, CSP fix, etc.).

## Immediate Next Steps

1.  **✅ CloudFront Subdirectory Index Handling:** Implemented CloudFront Function via Terraform.
2.  **✅ AWS WAF Implementation:** Added WAF with managed rules via Terraform.
3.  **✅ Lambda & DynamoDB Base Setup:** Created Lambda function, DynamoDB table, and IAM resources via Terraform.
4.  **Next: Baseline Testing:** Implement basic functional UI tests using Cypress.
5.  **Next: Lambda Trigger (Optional):** Define how the Lambda function will be invoked (e.g., API Gateway).

## Active Decisions & Considerations

*   **Lambda/DynamoDB Management:** These backend components are managed via Terraform within the `/terraform` directory, consistent with other infrastructure.
*   **Lambda Source Code Location:** Lambda source code (`/lambda_src`) and build artifacts (`/build`) are kept in the project root, separate from the Next.js application code (`/app`, `/components`).
*   **Lambda Packaging:** Requires a manual build/package step (`pnpm run package` in `/lambda_src`) before running `terraform apply`.
*   **Terraform Structure:** Added specific files (`lambda_dynamodb.tf`, `variables_lambda_dynamodb.tf`, `outputs_lambda_dynamodb.tf`) to the `/terraform` directory rather than merging into `main.tf` for modularity.
*   (Previous decisions: Preview Env structure, Secrets, CF Functions, CSP, WAF, etc.).

## Key Patterns & Preferences

*   Use Terraform to manage all AWS infrastructure, including serverless components like Lambda and DynamoDB.
*   Co-locate Lambda source code (`/lambda_src`) near the root but keep Terraform definitions centralized (`/terraform`).
*   Use Node.js scripts (e.g., `zip.js` with `archiver`) for platform-independent build steps like packaging when system commands (`zip`) are unreliable.
*   Use `terraform import` to bring existing resources under Terraform management when encountering `EntityAlreadyExists` errors.
*   Define `terraform` and `provider` blocks only once per module (typically in `main.tf` or `versions.tf`).
*   (Previous patterns: Next.js SSG, Tailwind, shadcn/ui, Terraform IaC, OIDC, Preview Envs, WAF, CF Functions).

## Learnings & Insights (Recent - Lambda/DynamoDB & Terraform Issues)

*   The `zip` command is not universally available, especially on Windows; Node.js packages like `archiver` provide a cross-platform solution for creating zip archives in build scripts.
*   `terraform apply` errors like `EntityAlreadyExists` often indicate resources exist in AWS but not in the Terraform state, requiring `terraform import`.
*   `terraform init` errors like `Duplicate provider configuration` occur when `provider` or `terraform` blocks are defined in multiple `.tf` files within the same module; these should be centralized.
*   File path references in Terraform (`${path.module}`) are relative to the `.tf` file's location. Paths need adjustment when moving files (e.g., `../lambda_src` when accessing from `/terraform`).
*   Terminal tools within some environments might struggle with relative path navigation (`cd ..`), requiring explicit full paths or careful command chaining.
*   (Previous learnings: Preview Envs, WAF, CSP/Next.js, etc.). 
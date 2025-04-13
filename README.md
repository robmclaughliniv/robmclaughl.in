# robmclaughl.in - Personal Website

This repository contains the source code for Rob McLaughlin's personal website ([robmclaughl.in](https://robmclaughl.in)). It's a single-page application built with Next.js, React, TailwindCSS, and deployed on AWS using Terraform and GitHub Actions.

## Getting Started (Local Development)

Follow these steps to set up the project for local development:

### Prerequisites

*   **Node.js:** Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/). LTS version is recommended.
*   **pnpm:** This project uses pnpm for package management. Install it globally:
    ```bash
    npm install -g pnpm
    ```
*   **(Optional) AWS CLI:** Needed if you plan to interact with AWS services directly or use LocalStack for local AWS simulation. Install v2: [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
*   **(Optional) Docker & LocalStack:** If you want to simulate AWS services locally, you'll need Docker and LocalStack. Refer to `LOCAL_DEVELOPMENT.md` for setup instructions.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url> # Replace <repository-url> with the actual repo URL
    cd robmclaughl.in
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### Running the Development Server

*   To start the Next.js development server:
    ```bash
    pnpm run dev
    ```
*   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The application will automatically reload if you edit the source files.

## Environment Management (Local/Development vs. Production)

This project utilizes different environments to separate development activities from the live production deployment. Understanding how to switch between these and how configurations are managed is crucial.

### Environment Overview

*   **Local:** Your local machine using `pnpm run dev`. Ideal for rapid UI development and component testing. May use tools like [LocalStack](https://localstack.cloud/) to simulate AWS services (see `LOCAL_DEVELOPMENT.md`).
*   **Development (`dev`):** A deployed environment mirroring production but used for integration testing, previews, and staging changes before they go live. Typically uses AWS resources prefixed or suffixed with `dev`. *(Note: Specific `dev` deployment workflow might need configuration)*.
*   **Production (`prod`):** The live environment accessible to end-users at `robmclaughl.in`. Uses AWS resources managed by Terraform and deployed via GitHub Actions from the `main` branch.

### Terraform Configuration (Workspaces)

We use [Terraform Workspaces](https://developer.hashicorp.com/terraform/language/state/workspaces) to manage separate infrastructure deployments for different environments (e.g., `dev`, `prod`). Each workspace maintains its own state file, ensuring environments are isolated.

*   **Navigate to Terraform Directory:**
    ```bash
    cd terraform
    ```
*   **Checking Current Workspace:**
    ```bash
    terraform workspace show
    ```
*   **Listing Available Workspaces:**
    ```bash
    terraform workspace list
    ```
*   **Creating a New Workspace (e.g., `dev`):**
    ```bash
    terraform workspace new dev
    ```
*   **Switching Workspace:**
    ```bash
    terraform workspace select <workspace_name> # e.g., terraform workspace select dev
    ```

**Variable Management:**

Variables defined in `.tf` files (like `variables_lambda_dynamodb.tf`) can be made environment-specific using the `terraform.workspace` interpolation.

*Example (`lambda_dynamodb.tf`):*
```terraform
# Example assuming lambda/dynamo resources exist
# resource "aws_dynamodb_table" "my_table" {
#   name = "my-cool-table-${terraform.workspace}" # Results in my-cool-table-dev or my-cool-table-prod
#   # ... other configurations
# }

# resource "aws_lambda_function" "my_lambda" {
#   # ...
#   environment {
#     variables = {
#       TABLE_NAME = aws_dynamodb_table.my_table.name
#       API_ENDPOINT = terraform.workspace == "prod" ? "https://prod.api.example.com" : "https://dev.api.example.com"
#       ENVIRONMENT = terraform.workspace
#     }
#   }
#   # ...
# }

```
*(Note: The above Terraform example is illustrative. Adapt based on actual resource naming conventions in `terraform/*.tf` files)*

Alternatively, workspace-specific variable values can be defined in `.tfvars` files (e.g., `terraform/environments/dev.tfvars`, `terraform/environments/prod.tfvars`) and applied using the `-var-file` flag, though using `terraform.workspace` directly in resource definitions is often cleaner for simple naming conventions.

### Local Testing with Infrastructure

1.  **Frontend:** Run `pnpm run dev` as described above.
2.  **Backend/Infra (Simulation):**
    *   If using LocalStack, ensure it's running.
    *   Configure AWS CLI/SDKs to target LocalStack endpoints (e.g., via environment variables or AWS profile). See `LOCAL_DEVELOPMENT.md`.
    *   You can potentially run `terraform apply` against your LocalStack instance after selecting a dedicated `local` workspace (`terraform workspace new local; terraform workspace select local`). This requires configuring Terraform providers appropriately for LocalStack.

### Deployment via GitHub Actions

*   **Production:** Pushing changes to the `main` branch automatically triggers the GitHub Actions workflow defined in `.github/workflows/deploy.yml`. This workflow typically:
    1.  Selects the `prod` Terraform workspace (or the default workspace if `prod` isn't explicitly used).
    2.  Runs `terraform init` and `terraform apply` to update production infrastructure defined in the `terraform/` directory.
    3.  Builds the Next.js application (`pnpm run build`).
    4.  Deploys the static assets from the build output (`out/` or `.next/`) to the production S3 bucket.
    5.  Invalidates the CloudFront cache to serve the latest changes.
*   **Development:** A similar workflow *could* be configured for a `develop` or feature branch to deploy to the `dev` Terraform workspace, allowing for testing in a cloud environment before merging to `main`. (Check the `.github/workflows/` directory for any existing development deployment workflows).

**Important:** Always ensure you are in the correct Terraform workspace (`terraform workspace select <name>`) before running `terraform plan` or `terraform apply` manually from the `terraform` directory. The GitHub Actions workflow handles workspace selection automatically for its deployments based on its configuration.

## Troubleshooting

This section provides guidance on diagnosing and resolving common issues encountered during development and deployment.

### Common Issues & Solutions

*   **IAM Permission Errors (`AccessDenied`, `UnauthorizedOperation`)**
    *   **During `terraform apply` (local):** Ensure your local AWS credentials (profile or environment variables) have the necessary permissions defined in `terraform/aws-policy-README.md` or similar documentation.
    *   **During GitHub Actions Deployment:** Verify the IAM role assumed by GitHub Actions (`aws-deploy-role` or similar) has the correct permissions. Check the attached policies and the trust relationship policy (`aws-deploy-trust-policy.json`) to ensure it correctly allows the GitHub OIDC provider.
    *   **Lambda Execution:** Ensure the Lambda function's execution role has permissions to access required services (e.g., DynamoDB read/write, other AWS services).
*   **API Gateway / Lambda Errors (5xx, 403)**
    *   **5xx Internal Server Error:** Check the Lambda function's CloudWatch Logs (see below) for runtime errors, timeouts, or configuration issues (e.g., missing environment variables).
    *   **403 Forbidden:**
        *   Check if the API Gateway endpoint requires authentication/authorization that isn't being met.
        *   Verify API Gateway resource policies if applicable.
        *   Ensure the correct stage is deployed in API Gateway.
    *   **Incorrect Routing:** Double-check API Gateway route configuration and Lambda proxy integration settings. Ensure the deployed Lambda function code matches the expected route handlers.
*   **Local vs. Production Discrepancies**
    *   **Environment Variables:** Ensure all necessary environment variables used in production are also defined locally (e.g., in a `.env.local` file - **do not commit secrets!**) or are properly simulated.
    *   **AWS Services:** Real AWS services might behave differently or have stricter configurations than LocalStack simulations. Test critical integrations in a `dev` environment if possible.
    *   **Build Output:** Use `pnpm run build` followed by `pnpm run start` locally to test the production build, as it can differ from the `pnpm run dev` server.
    *   **Node.js Version:** Ensure your local Node.js version matches the Lambda runtime version specified in Terraform or the GitHub Actions runner environment.
*   **Terraform Errors (`plan`/`apply` failures)**
    *   **Syntax Errors:** Run `terraform validate` within the `terraform` directory.
    *   **Provider Issues:** Ensure correct provider versions are pinned in `versions.tf` and run `terraform init` if you encounter provider-related errors.
    *   **State Drift:** Run `terraform plan` frequently. If drift is detected (resources changed outside Terraform), you may need to run `terraform apply` to reconcile or `terraform import` if resources were created manually.
    *   **Resource Conflicts:** Check resource names, especially if using `terraform.workspace` for naming, to ensure they don't clash with existing resources in the target AWS account/region/workspace.
*   **Deployment Failures (GitHub Actions)**
    *   **Build Errors:** Check the workflow logs for errors during `pnpm install` or `pnpm run build`. Ensure all dependencies are correctly listed in `package.json`.
    *   **Authentication Errors:** Verify OIDC configuration between GitHub and AWS IAM. Ensure the workflow has the correct `permissions` block for `id-token: write`.
    *   **Terraform Step Failures:** Examine the `terraform plan` or `terraform apply` output in the workflow logs for specific errors (often IAM or resource conflicts).
    *   **S3 Sync / CloudFront Invalidation Errors:** Check permissions for the deployment role on the target S3 bucket and CloudFront distribution.

### Using CloudWatch Logs for Lambda

Lambda functions automatically send logs to AWS CloudWatch Logs. This is essential for debugging deployed functions.

1.  **Navigate to CloudWatch:** Go to the AWS Management Console -> CloudWatch.
2.  **Find Log Group:** In the left navigation pane, click "Log groups". Search for the log group associated with your Lambda function. It's typically named `/aws/lambda/<your-function-name>`. The function name is usually defined in your Terraform configuration (e.g., `lambda_dynamodb.tf`).
3.  **Explore Log Streams:** Click on the log group name. You'll see various log streams (usually one per function instance/execution environment). Select a recent stream.
4.  **Analyze Logs:** Look for error messages (`ERROR`, `Traceback`, `Exception`), timeouts, or unexpected output. Logs often include the request ID, which can help correlate specific API Gateway requests to Lambda executions.
5.  **Filtering:** Use the "Filter events" search bar to find specific keywords, request IDs, or filter by time range.

Also, check CloudWatch **Metrics** for your Lambda function (Invocation count, Errors, Duration, Throttles) for performance insights.

### Verifying Terraform State and Configuration

If you suspect infrastructure issues or discrepancies:

1.  **Navigate to Terraform Directory:** `cd terraform`
2.  **Select Correct Workspace:** `terraform workspace select <workspace_name>` (e.g., `prod`, `dev`)
3.  **Check for Drift:** Run `terraform plan`. This compares your configuration files to the actual deployed resources recorded in the state file and shows any differences. **Do not apply** if you only want to check.
4.  **List Managed Resources:** `terraform state list` shows all resources Terraform is managing in the current workspace.
5.  **Inspect Specific Resource State:** `terraform state show <resource_address>` (e.g., `terraform state show aws_s3_bucket.website_bucket`) displays the attributes stored in the Terraform state for that resource.
6.  **Validate Configuration:** `terraform validate` checks the syntax of your `.tf` files.
7.  **Compare with AWS Console:** If discrepancies persist, manually inspect the resource configuration in the AWS Management Console and compare it against the output of `terraform state show` and your `.tf` files.

### Replicating Production Behavior Locally

While a perfect replica is difficult, aim for similarity:

*   **Use LocalStack:** Simulate AWS services (S3, DynamoDB, Lambda, API Gateway) locally. See `LOCAL_DEVELOPMENT.md`. Configure Terraform and your application (e.g., via AWS SDK environment variables) to point to LocalStack endpoints.
*   **Environment Variables:** Maintain a `.env.local` file (not committed to Git) with environment variables that mirror the structure and types of those used in production/Lambda.
*   **Test Production Build:** Run `pnpm run build && pnpm run start` to test the optimized static/server build locally.
*   **Consistent Node Version:** Use the Node.js version defined for your Lambda runtime. Tools like `nvm` (Node Version Manager) can help manage multiple Node versions. 
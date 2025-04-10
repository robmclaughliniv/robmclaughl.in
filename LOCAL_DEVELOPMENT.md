# Local Lambda Development Setup using LocalStack

This guide explains how to set up a local development environment to build, run, and test the project's AWS Lambda function (`/lambda_src`) using LocalStack. LocalStack emulates AWS services (Lambda, DynamoDB, etc.) on your local machine.

## Prerequisites

*   **Docker:** LocalStack runs in a Docker container. Install Docker Desktop: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
*   **LocalStack CLI:** Used for starting/stopping LocalStack. Install using pip:
    ```bash
    pip install localstack
    ```
*   **AWS CLI:** Needed for interacting with LocalStack services (creating tables, invoking functions, etc.). Install v2: [https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
    *(Note: You don't need to configure AWS credentials for local development with LocalStack).*
*   **pnpm:** Used for building the Lambda package. Install if you haven't: `npm install -g pnpm`
*   **(Windows Specific)** Ensure Win32 long path support is enabled if you encounter `pip install` errors related to path length: [https://pip.pypa.io/warnings/enable-long-paths](https://pip.pypa.io/warnings/enable-long-paths)

## 1. Start LocalStack

Open your terminal and start LocalStack in detached mode. This command starts the necessary services (Lambda, DynamoDB).

```bash
# Ensure Docker Desktop is running
localstack start -d
```

Wait a few moments for LocalStack to initialize. You can check the status with `localstack status services`.

## 2. Build the Lambda Function

Navigate to the Lambda source directory and build the deployment package.

```bash
cd lambda_src
pnpm install
pnpm run package # This creates ../build/lambda_function.zip
cd ..
```

## 3. Create Local DynamoDB Table

Use the AWS CLI pointed at the LocalStack endpoint (`http://localhost:4566`) to create the DynamoDB table that the Lambda function will interact with. We'll use `dev` as the local environment name.

**Note:** While `awscli-local` provides an `awslocal` wrapper command, using the standard `aws` CLI with `--endpoint-url` is recommended for better stability, as `awslocal` has been observed to cause issues (e.g., segmentation faults) in some terminal environments (like Git Bash/MINGW64 on Windows).

```bash
aws dynamodb create-table \
    --endpoint-url=http://localhost:4566 \
    --table-name robmclaughlin-dev \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

You can verify table creation with `aws dynamodb list-tables --endpoint-url=http://localhost:4566`.

## 4. Deploy Lambda Function to LocalStack

Deploy the built Lambda function package to your local LocalStack environment using the AWS CLI.

*   Replace `YOUR_ACCOUNT_ID` with any placeholder ID (e.g., `000000000000`). LocalStack doesn't validate this strictly.
*   Replace `YOUR_AWS_REGION` with your desired local region (e.g., `us-west-2`).
*   Ensure the path to `lambda_function.zip` is correct relative to your current directory (should be `./build/lambda_function.zip` if running from the project root).

```bash
aws lambda create-function \
    --endpoint-url=http://localhost:4566 \
    --function-name robmclaughlin-dev-function \
    --runtime nodejs20.x \
    --handler index.handler \
    --memory-size 128 \
    --zip-file fileb://./build/lambda_function.zip \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --environment "Variables={DYNAMODB_TABLE_NAME=robmclaughlin-dev}" \
    --region us-west-2 # Or your preferred region
```

**Notes:**
*   `--role`: LocalStack doesn't strictly enforce IAM roles by default, so a dummy ARN usually works.
*   `--environment`: Sets the `DYNAMODB_TABLE_NAME` environment variable within the local Lambda environment, just like Terraform does in AWS.
*   The AWS SDK within the Lambda function, when running inside LocalStack, is often automatically patched or configured to use the local DynamoDB endpoint (`http://localhost:4566`). If you encounter issues connecting to DynamoDB, you might need to explicitly configure the endpoint in the Lambda code based on an environment variable like `AWS_ENDPOINT_URL`, but try without this first.

## 5. Invoke the Local Lambda Function

Now you can invoke the function running in LocalStack.

**Important:** When invoking a Lambda function directly via the CLI (as opposed to through API Gateway), the entire payload provided becomes the `event` object within the Lambda. However, our Lambda function is written to expect an event structure similar to what API Gateway provides, where the actual client payload is nested within the `event.body` property (usually as a string).

To simulate this structure for local testing, create a `payload.json` file where the actual message is the string value of the `body` key:

```bash
# Create payload.json in the current directory
# Note the escaped quotes inside the 'body' string value
echo '{"body": "{\"name\": \"Local Test User\", \"message\": \"This is a test message from local.\"}"}' > payload.json
```

Now, invoke the function using this payload file. The `fileb://` prefix is used to pass the file content correctly.

```bash
# Invoke the function
aws lambda invoke \
    --endpoint-url=http://localhost:4566 \
    --function-name robmclaughlin-dev-function \
    --payload fileb://payload.json \
    output.log

# Check the invocation status (should be StatusCode 200 if no unhandled errors)
cat output.log
echo # Add a newline for clarity

# The output.log contains the *response* from the Lambda function.
# Look for a successful response (e.g., statusCode 201 or 200 with a success message in the body).

# View detailed execution logs (optional - requires LocalStack Pro or extensions)
# aws logs tail /aws/lambda/robmclaughlin-dev-function --endpoint-url=http://localhost:4566
```

## 5b. Verify DynamoDB Record Creation

After a successful invocation that should have created a record, you can verify its existence in the local DynamoDB table:

```bash
aws dynamodb scan \
    --endpoint-url=http://localhost:4566 \
    --table-name robmclaughlin-dev
```

This should show the item(s) created by your test invocations.

## 6. Develop and Re-deploy

If you make changes to the Lambda code (`/lambda_src`):

1.  Re-build the package: `cd lambda_src && pnpm run package && cd ..`
2.  Update the function code in LocalStack:
    ```bash
    aws lambda update-function-code \
        --endpoint-url=http://localhost:4566 \
        --function-name robmclaughlin-dev-function \
        --zip-file fileb://./build/lambda_function.zip
    ```
3.  Re-invoke and verify as needed (Steps 5 and 5b).

## 7. Stop LocalStack

When you are finished with local development, stop the LocalStack container:

```bash
localstack stop
```

This setup provides a reliable way to test your Lambda function's logic and its interaction with DynamoDB locally before committing changes or running the CI/CD pipeline. 
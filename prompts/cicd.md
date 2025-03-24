I have finished creating terraform configuration. It is time to build infrastructure for CI/CD.

Now let's create the **GitHub Actions CI/CD pipeline** as a YAML workflow file. The goal is to automate deployment: when code is pushed to the **main branch**, the site should build and deploy to AWS.

Requirements for the workflow:
- Trigger on pushes to the `main` branch.
- Use an Ubuntu latest runner.
- Steps:
  1. **Checkout the repository** (use actions/checkout).
  2. **Set up Node.js** – use actions/setup-node@v3. We are using Node 18 (Latest LTS), so configure `node-version: 18`. Also enable caching for `node_modules` (setup-node has built-in caching).
  3. **Install dependencies** – e.g., `npm ci` (since we have package-lock or yarn, adjust accordingly; assume npm).
  4. **Build the Next.js project** – run `npm run build`. This should produce the `.next` folder. Then run `npm run export` to export the site as static files into the `out/` directory (because we set `output: 'export'`).
  5. **Configure AWS Credentials** – use the AWS CLI credentials action with OIDC. For example, use `aws-actions/configure-aws-credentials@v2` with:
       - `role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}` (this secret will store the ARN of the IAM role from Terraform).
       - `aws-region: us-east-1` (region for any AWS calls, though S3 might be in another region, we can also configure that).
       - `role-session-name: rob-site-deploy` (an identifier).
     This will let us assume the deployment role without static creds.
  6. **Sync to S3** – use AWS CLI to copy the static files. For example, a run step:
       `aws s3 sync ./out s3://robmclaughl.in-website-bucket --delete`
     (Replace bucket name with the actual name output from Terraform). The `--delete` ensures removed files are cleaned up. We should also include `--acl private` just in case (though the bucket enforces it).
  7. **Invalidate CloudFront cache** – another run step:
       `aws cloudfront create-invalidation --distribution-id ABCD1234 --paths "/*"`
     (Replace `ABCD1234` with the actual CloudFront Distribution ID, which we can store as an encrypted secret or as an output from Terraform passed via environment). This step makes sure the new files are served.
  8. (Optional) **Post-deployment notification** – e.g., print a success message or notify Slack (not required now).

Add some basic error handling: if build fails, the workflow should stop. If deploy fails, it should also stop and indicate failure.

Name the job “deploy” and the workflow “Deploy to AWS”. Ensure that the AWS secrets (role ARN, possibly bucket name or distribution ID) are referenced securely (via GitHub secrets or repo vars).

Provide the YAML for this GitHub Actions workflow.

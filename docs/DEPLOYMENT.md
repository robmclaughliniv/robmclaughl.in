# Deployment Guide

> Procedures for deploying robmclaughl.in to production

## Overview

The site uses automated deployment via GitHub Actions. This document covers:
- Automated deployment flow
- Manual deployment procedures
- Rollback procedures
- Infrastructure changes

---

## Deployment Architecture

```
┌─────────────────┐
│   Developer     │
│   pushes code   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    GitHub       │
│    master       │
└────────┬────────┘
         │ triggers
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions                            │
├─────────────────────────────────────────────────────────────┤
│  1. Checkout code                                           │
│  2. Setup Node.js                                           │
│  3. Install dependencies (pnpm)                             │
│  4. Build Next.js (npm run build → /out)                   │
│  5. Configure AWS credentials (OIDC)                        │
│  6. Terraform init/plan/apply (if changes)                  │
│  7. Sync /out to S3                                         │
│  8. Invalidate CloudFront cache                             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│       S3        │     │   CloudFront    │
│  (static files) │◄────│    (CDN)        │
└─────────────────┘     └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
              ┌─────────────────┐
              │    Users        │
              │ robmclaughl.in  │
              └─────────────────┘
```

---

## Automated Deployment

### Trigger

Deployment automatically triggers when:
- Code is pushed to `master` branch
- Pull request is merged to `master`

### Workflow File

Location: `.github/workflows/deploy.yml`

### Expected Duration

| Step | Duration |
|------|----------|
| Checkout | ~10s |
| Setup Node | ~30s |
| Install deps | ~60s |
| Build | ~60-120s |
| Terraform | ~30-300s |
| S3 Sync | ~30s |
| CloudFront Invalidate | ~30s |
| **Total** | **3-8 minutes** |

### Monitoring Deployment

1. Go to repository on GitHub
2. Click "Actions" tab
3. Select latest workflow run
4. Monitor step-by-step progress

---

## Manual Deployment

### Prerequisites

- AWS CLI v2 configured
- Node.js and pnpm installed
- Terraform installed
- Appropriate AWS permissions

### Build and Deploy Manually

```bash
# 1. Build the site
pnpm install
pnpm run build

# 2. Verify build output exists
ls -la out/

# 3. Sync to S3
aws s3 sync out/ s3://robmclaughl-in-website-bucket \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "*.json"

# Sync HTML/JSON with shorter cache
aws s3 sync out/ s3://robmclaughl-in-website-bucket \
  --delete \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "*.html" \
  --include "*.json"

# 4. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

### Deploy Infrastructure Only

```bash
cd terraform

# Initialize (if needed)
terraform init

# Select workspace
terraform workspace select prod

# Preview changes
terraform plan

# Apply (with approval)
terraform apply
```

---

## Pre-Deployment Checklist

Before deploying, verify:

- [ ] `npm run build` succeeds locally
- [ ] No TypeScript errors (when enabled)
- [ ] No ESLint errors (when enabled)
- [ ] Tests pass (when implemented)
- [ ] Sensitive data not committed
- [ ] Environment variables documented
- [ ] CHANGELOG updated (for significant changes)

---

## Post-Deployment Verification

### Automated Checks (Future)

Planned smoke tests:
- Homepage loads
- Critical paths accessible
- No console errors
- Performance metrics acceptable

### Manual Verification

After deployment, verify:

1. **Homepage loads**: https://robmclaughl.in
2. **Assets load**: Check images, videos, fonts
3. **Links work**: Test social links
4. **Console clean**: No JavaScript errors
5. **Mobile works**: Test on mobile device

### Rollback Trigger Conditions

Consider rollback if:
- Homepage returns 5xx error
- Critical JavaScript errors in console
- Significant visual regression
- Performance degradation > 50%

---

## Rollback Procedures

### Option A: Redeploy Previous Commit

```bash
# Find previous working commit
git log --oneline -10

# Revert to previous commit
git revert HEAD

# Push to trigger deployment
git push origin master
```

### Option B: Restore S3 from Backup

If S3 versioning is enabled:

```bash
# List object versions
aws s3api list-object-versions \
  --bucket robmclaughl-in-website-bucket \
  --prefix "index.html"

# Restore specific version
aws s3api copy-object \
  --bucket robmclaughl-in-website-bucket \
  --copy-source robmclaughl-in-website-bucket/index.html?versionId=<VERSION_ID> \
  --key index.html
```

### Option C: Terraform Rollback

For infrastructure issues:

```bash
cd terraform

# Show state history (if using remote state with versioning)
# Restore previous state version via S3 console

# Or revert Terraform changes
git checkout HEAD~1 -- *.tf
terraform plan
terraform apply
```

---

## Environment-Specific Deployment

### Production (`prod`)

- **Branch**: `master`
- **Terraform Workspace**: `prod`
- **URL**: https://robmclaughl.in
- **Auto-deploy**: Yes

### Development (`dev`) - Future

- **Branch**: `develop` (proposed)
- **Terraform Workspace**: `dev`
- **URL**: https://dev.robmclaughl.in (proposed)
- **Auto-deploy**: Yes (on develop push)

### Preview Deployments - Future

- **Branch**: Any PR
- **URL**: https://pr-{number}.preview.robmclaughl.in
- **Auto-deploy**: On PR creation/update
- **Cleanup**: On PR close/merge

---

## Infrastructure Deployment

### When Infrastructure Changes

If modifying `terraform/*.tf` files:

1. **Plan locally first**:
   ```bash
   cd terraform
   terraform workspace select prod
   terraform plan -out=tfplan
   ```

2. **Review plan carefully**:
   - Resources being created
   - Resources being destroyed
   - Resources being modified

3. **Apply via CI/CD** (preferred):
   - Commit changes
   - Push to master
   - Workflow handles apply

4. **Or apply manually** (if urgent):
   ```bash
   terraform apply tfplan
   ```

### Dangerous Operations

**Never run without careful review:**
- `terraform destroy`
- Modifications to S3 bucket policies
- Changes to CloudFront distribution
- IAM role/policy changes

---

## Lambda Deployment

### Lambda Source Location

`lambda_src/` directory contains Lambda code.

### Build Lambda

```bash
cd lambda_src
npm install
npm run build  # Compiles TypeScript
```

### Deploy Lambda

Lambda is deployed via Terraform:

```hcl
resource "aws_lambda_function" "api" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "robmclaughl-in-api"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
}
```

### Update Lambda Code Only

To update Lambda without full infrastructure deploy:

```bash
# Build
cd lambda_src && npm run build

# Zip
zip -r function.zip dist/

# Update
aws lambda update-function-code \
  --function-name robmclaughl-in-api \
  --zip-file fileb://function.zip
```

---

## Secrets Deployment

### Adding New Secrets

1. **Add to SSM Parameter Store**:
   ```bash
   aws ssm put-parameter \
     --name "/robmclaughl-in/new-secret" \
     --type "SecureString" \
     --value "secret-value"
   ```

2. **Reference in Terraform**:
   ```hcl
   data "aws_ssm_parameter" "new_secret" {
     name = "/robmclaughl-in/new-secret"
   }
   ```

3. **Pass to Lambda**:
   ```hcl
   environment {
     variables = {
       NEW_SECRET = data.aws_ssm_parameter.new_secret.value
     }
   }
   ```

### Rotating Secrets

1. Update value in SSM Parameter Store
2. Redeploy Lambda to pick up new value
3. Test functionality
4. Delete old secret if separate entry

---

## Monitoring Deployments

### CloudWatch Logs

- Lambda logs: `/aws/lambda/robmclaughl-in-api`
- API Gateway logs: If enabled

### CloudWatch Metrics

Key metrics to monitor:
- Lambda invocations
- Lambda errors
- Lambda duration
- CloudFront requests
- CloudFront error rate

### Alerts (Recommended Setup)

```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "robmclaughl-in-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda function errors"

  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }
}
```

---

## Troubleshooting Deployments

### Build Failures

| Error | Solution |
|-------|----------|
| Missing dependencies | Run `pnpm install` |
| TypeScript errors | Fix type issues or check tsconfig |
| Out of memory | Increase Node memory: `NODE_OPTIONS=--max_old_space_size=4096` |

### S3 Sync Failures

| Error | Solution |
|-------|----------|
| Access denied | Check IAM permissions |
| Bucket not found | Verify bucket name |
| Invalid credentials | Re-authenticate AWS CLI |

### CloudFront Invalidation Failures

| Error | Solution |
|-------|----------|
| Distribution not found | Check distribution ID |
| Too many invalidations | Wait for previous to complete |
| Access denied | Check IAM permissions |

### Terraform Failures

| Error | Solution |
|-------|----------|
| State locked | Wait or force-unlock (carefully) |
| Provider errors | Run `terraform init -upgrade` |
| Resource conflicts | Check for manual changes |

---

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SECURITY.md](./SECURITY.md) - Security considerations
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development workflow

---

*Last updated: January 2026*

# Security Documentation

> Security requirements, guidelines, and best practices

## Overview

This document outlines security considerations for robmclaughl.in, with emphasis on:
- API security
- Infrastructure security
- Frontend security
- Secrets management

---

## Security Architecture

```
                    ┌─────────────────────────────────┐
                    │           INTERNET              │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │         WAF (AWS)               │
                    │  • Rate limiting                │
                    │  • IP reputation                │
                    │  • SQL injection protection     │
                    │  • XSS protection               │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │        CloudFront               │
                    │  • HTTPS only                   │
                    │  • TLS 1.2+                     │
                    │  • Origin access control        │
                    └───────────────┬─────────────────┘
                        ┌───────────┴───────────┐
            ┌───────────▼───────┐   ┌───────────▼───────────┐
            │        S3         │   │     API Gateway       │
            │  • Private        │   │  • Throttling         │
            │  • OAC only       │   │  • Request validation │
            └───────────────────┘   └───────────┬───────────┘
                                                │
                                    ┌───────────▼───────────┐
                                    │       Lambda          │
                                    │  • IAM least priv     │
                                    │  • Input validation   │
                                    │  • Output sanitization│
                                    └───────────────────────┘
```

---

## Current Security Status

### Implemented

| Feature | Status | Location |
|---------|--------|----------|
| HTTPS enforcement | ✅ | CloudFront |
| WAF protection | ✅ | CloudFront |
| S3 private access | ✅ | OAC |
| Terraform state encryption | ✅ | S3 |
| GitHub OIDC auth | ✅ | IAM |

### Needs Improvement

| Issue | Priority | Reference |
|-------|----------|-----------|
| CORS wildcard | Medium | TD-005 |
| No CSP headers | Medium | IP-006 |
| No rate limiting | High | Before AI features |
| No CAPTCHA | High | Before AI features |

---

## Secrets Management

### API Keys

**DO NOT:**
- Commit API keys to repository
- Log API keys
- Expose keys to frontend
- Hardcode keys in Lambda code

**DO:**
- Store in AWS SSM Parameter Store (SecureString)
- Store in AWS Secrets Manager
- Reference via environment variables
- Rotate keys periodically

### Storage Pattern

```hcl
# Terraform - SSM Parameter Store
resource "aws_ssm_parameter" "openai_key" {
  name        = "/robmclaughl-in/openai-api-key"
  description = "OpenAI API key for DALL-E"
  type        = "SecureString"
  value       = var.openai_api_key  # Passed via TF_VAR or -var

  tags = {
    Environment = terraform.workspace
    Purpose     = "api-key"
  }
}

# Lambda reference
resource "aws_lambda_function" "api" {
  # ...
  environment {
    variables = {
      OPENAI_API_KEY = aws_ssm_parameter.openai_key.value
    }
  }
}
```

### GitHub Actions Secrets

Store in repository secrets (Settings > Secrets):
- `AWS_ACCOUNT_ID` - AWS account number
- `OPENAI_API_KEY` - For deployment (if setting SSM via CI)

### Local Development

Create `.env.local` (gitignored):
```bash
OPENAI_API_KEY=sk-...
CAPTCHA_SECRET=0x...
```

---

## API Security

### Input Validation

Validate ALL user input before processing:

```typescript
// Example validation schema
import { z } from 'zod';

const GenerateImageSchema = z.object({
  mood: z.enum(['chill', 'focus', 'ambient', 'late-night']),
  style: z.string().max(100).optional(),
  captchaToken: z.string().min(1),
});

// In handler
const result = GenerateImageSchema.safeParse(body);
if (!result.success) {
  return createResponse(400, {
    error: 'Invalid input',
    details: result.error.issues,
  });
}
```

### Rate Limiting

Implement rate limiting BEFORE enabling AI features:

```typescript
interface RateLimitConfig {
  windowMs: number;      // Time window
  maxRequests: number;   // Max requests per window
  keyGenerator: (req) => string;  // User identifier
}

const IMAGE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 5,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'],
};
```

### CAPTCHA Protection

Use CAPTCHA for expensive operations:

**Recommended: Cloudflare Turnstile**
- Free tier available
- Privacy-focused
- Low friction

**Implementation:**

```typescript
// Frontend
import Turnstile from '@cloudflare/turnstile';

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
  onSuccess={(token) => setCaptchaToken(token)}
/>

// Backend verification
async function verifyCaptcha(token: string): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.CAPTCHA_SECRET}&response=${token}`,
    }
  );
  const data = await response.json();
  return data.success === true;
}
```

### CORS Configuration

**Current (insecure):**
```typescript
'Access-Control-Allow-Origin': '*'
```

**Recommended:**
```typescript
const ALLOWED_ORIGINS = [
  'https://robmclaughl.in',
  'https://www.robmclaughl.in',
];

if (process.env.ENVIRONMENT === 'dev') {
  ALLOWED_ORIGINS.push('http://localhost:3000');
}

const origin = event.headers.origin;
const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

return {
  headers: {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
};
```

---

## Frontend Security

### Content Security Policy

Implement CSP headers via CloudFront custom headers or Lambda@Edge:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  media-src 'self' https: blob:;
  connect-src 'self' https://api.openai.com https://challenges.cloudflare.com;
  font-src 'self';
  frame-src https://challenges.cloudflare.com;
  base-uri 'self';
  form-action 'self';
```

### XSS Prevention

1. **React escaping** - React escapes by default
2. **Avoid `dangerouslySetInnerHTML`** - Unless absolutely necessary
3. **Sanitize user content** - If displaying user input

```typescript
// If you must render HTML
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

### Dependency Security

Regular security audits:

```bash
# Check for vulnerabilities
npm audit

# Update vulnerable packages
npm audit fix

# For breaking changes
npm audit fix --force  # Use with caution
```

### Sensitive Data in Client

Never store in client code:
- API keys
- Database credentials
- User passwords
- Authentication tokens (use httpOnly cookies)

---

## Infrastructure Security

### S3 Bucket Security

```hcl
# Ensure bucket is not publicly accessible
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

### Lambda Security

**IAM Least Privilege:**
```hcl
# Only grant necessary permissions
resource "aws_iam_role_policy" "lambda_policy" {
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
        ]
        Resource = [
          aws_dynamodb_table.generations.arn,
          aws_dynamodb_table.rate_limits.arn,
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
        ]
        Resource = "${aws_s3_bucket.assets.arn}/vibe-visuals/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
        ]
        Resource = aws_ssm_parameter.openai_key.arn
      },
    ]
  })
}
```

### DynamoDB Security

- Enable encryption at rest (default)
- Use IAM for access control
- Enable point-in-time recovery for production

### Terraform State Security

```hcl
terraform {
  backend "s3" {
    bucket         = "robmclaughl-in-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true  # Enable encryption
    dynamodb_table = "terraform-locks"  # State locking
  }
}
```

---

## Incident Response

### If API Key is Exposed

1. **Immediately rotate the key** in provider dashboard
2. Update SSM Parameter Store
3. Redeploy Lambda
4. Review CloudWatch logs for unauthorized usage
5. Document incident

### If Suspicious Activity Detected

1. Check WAF logs in CloudWatch
2. Review API Gateway access logs
3. Check for unusual DynamoDB read/write patterns
4. Consider enabling additional WAF rules
5. Add suspicious IPs to block list

### Contact Points

- AWS Support (if subscribed)
- OpenAI Support for API issues
- GitHub Security for repo issues

---

## Security Checklist for Features

Before deploying any feature:

- [ ] Input validation on all user data
- [ ] Output encoding/escaping
- [ ] No secrets in client code
- [ ] Rate limiting for expensive operations
- [ ] CAPTCHA for abuse-prone endpoints
- [ ] Appropriate CORS configuration
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't include secrets
- [ ] Dependencies audited for vulnerabilities
- [ ] IAM permissions are minimal

---

## Compliance Considerations

### GDPR (if applicable)

- No personal data collection currently
- If adding: implement consent, right to deletion
- Cookie consent for any tracking

### Terms of Service

- OpenAI usage must comply with their ToS
- Generated content may have restrictions
- No impersonation or harmful content

---

## Related Documents

- [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) - Security debt items
- [API_INTEGRATION.md](./API_INTEGRATION.md) - API security
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Secure deployment

---

*Last updated: January 2026*

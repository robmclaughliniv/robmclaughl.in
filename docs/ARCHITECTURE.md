# Architecture Documentation

> Comprehensive system architecture for robmclaughl.in

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Frontend Architecture](#2-frontend-architecture)
3. [Backend Architecture](#3-backend-architecture)
4. [Infrastructure Architecture](#4-infrastructure-architecture)
5. [Data Flow](#5-data-flow)
6. [Code Organization](#6-code-organization)
7. [Design Patterns](#7-design-patterns)
8. [Technology Stack](#8-technology-stack)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFRONT CDN                            │
│  • Global edge locations                                         │
│  • HTTPS termination                                             │
│  • WAF protection                                                │
│  • Cache management                                              │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│      S3 BUCKET            │   │       API GATEWAY             │
│  • Static site hosting    │   │  • HTTP API v2                │
│  • Next.js export files   │   │  • Lambda integration         │
│  • Videos, images, assets │   │  • CORS handling              │
└───────────────────────────┘   └───────────────────────────────┘
                                                │
                                                ▼
                                ┌───────────────────────────────┐
                                │         LAMBDA                 │
                                │  • Node.js 20.x runtime       │
                                │  • TypeScript handlers        │
                                │  • DynamoDB client            │
                                └───────────────────────────────┘
                                                │
                                                ▼
                                ┌───────────────────────────────┐
                                │        DYNAMODB               │
                                │  • On-demand capacity         │
                                │  • Key-value storage          │
                                └───────────────────────────────┘
```

### 1.2 Domain Architecture

| Domain | Purpose |
|--------|---------|
| `robmclaughl.in` | Main site (current) |
| `www.robmclaughl.in` | Redirects to apex |
| `api.robmclaughl.in` | API Gateway (planned) |
| `vibe.robmclaughl.in` | Vibe Generator (planned) |

---

## 2. Frontend Architecture

### 2.1 Next.js App Router Structure

```
app/
├── layout.tsx          # Root layout (fonts, metadata)
├── page.tsx            # Home page component
├── globals.css         # Global styles + CRT effects
└── [future-app]/       # Future app routes
    └── page.tsx
```

### 2.2 Component Hierarchy

```
<RootLayout>                    # app/layout.tsx
  └── <Home>                    # app/page.tsx
      └── <HeroBackground>      # components/HeroBackground.tsx
          ├── <video>           # Background video element
          ├── <div>             # CRT overlay effects
          └── <main>            # Content container
              ├── <Waveform>    # Decorative SVG
              ├── <header>      # Title + subtitle
              ├── <TooltipProvider>
              │   └── <nav>     # Social links
              │       └── <Button> × 3
              ├── <div>         # Bio card
              └── <footer>      # Copyright
```

### 2.3 Component Categories

| Category | Location | Purpose |
|----------|----------|---------|
| **Pages** | `app/` | Route components |
| **UI Primitives** | `components/ui/` | shadcn/ui components |
| **Custom Components** | `components/` | Project-specific |
| **Hooks** | `hooks/` | Custom React hooks |
| **Utilities** | `lib/` | Helper functions |

### 2.4 Styling Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      STYLING LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Component-specific styles (Tailwind classes)        │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: CRT/Lo-fi effects (globals.css animations)          │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: CSS Variables (colors, radii from shadcn)           │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Tailwind base + plugins                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 Build Output

- **Mode**: Static Export (`output: 'export'`)
- **Output Directory**: `/out`
- **Deployment**: S3 + CloudFront
- **No Server Required**: Pure static files

---

## 3. Backend Architecture

### 3.1 Lambda Handler Pattern

```typescript
// lambda_src/src/index.ts

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Response helper
const createResponse = (statusCode: number, body: object) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',  // Note: TD-005 - should be specific domain
  },
  body: JSON.stringify(body),
});

// Handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // 1. Validate environment
  // 2. Parse and validate request
  // 3. Business logic
  // 4. Database operations
  // 5. Return response
};
```

### 3.2 API Structure (Planned)

```
api.robmclaughl.in/
├── POST /messages              # Contact form (current)
├── GET  /vibe/channels         # Audio channels (planned)
├── POST /vibe/generate-image   # DALL-E integration (planned)
├── POST /vibe/generate-music   # Suno integration (planned)
└── GET  /health               # Health check (planned)
```

### 3.3 Database Schema

**Current Table: Messages**
```
{
  "id": "uuid",           // Partition key
  "name": "string",
  "message": "string",
  "createdAt": "ISO8601"
}
```

**Planned Tables:**
- `vibe-sessions` - User session data
- `vibe-generations` - AI generation history
- `rate-limits` - Rate limiting records

---

## 4. Infrastructure Architecture

### 4.1 Terraform Module Structure

```
terraform/
├── main.tf                  # Main configuration
├── variables.tf             # Input variables
├── outputs.tf               # Output values
├── versions.tf              # Provider versions
├── lambda_dynamodb.tf       # Lambda + DynamoDB
├── variables_lambda_dynamodb.tf
└── modules/
    ├── s3/                  # S3 bucket module
    ├── cloudfront/          # CloudFront distribution
    ├── acm/                 # SSL certificate
    ├── route53/             # DNS configuration
    └── iam/                 # IAM roles and policies
```

### 4.2 State Management

- **Backend**: S3 bucket with state locking
- **State Bucket**: `robmclaughl-in-terraform-state`
- **Lock Table**: `terraform-locks` (DynamoDB)
- **Workspaces**: `default`, `prod`, `dev` (optional)

### 4.3 Security Layers

```
                         ┌─────────────────┐
                         │      WAF        │
                         │ • Rate limiting │
                         │ • IP reputation │
                         │ • Common rules  │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │   CloudFront    │
                         │ • HTTPS only    │
                         │ • OAC for S3    │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
     ┌────────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
     │       S3        │ │   API Gateway  │ │     Lambda     │
     │ • Private       │ │ • Auth (opt)   │ │ • IAM role     │
     │ • OAC only      │ │ • Throttling   │ │ • Least priv   │
     └─────────────────┘ └────────────────┘ └────────────────┘
```

---

## 5. Data Flow

### 5.1 Static Content Flow

```
1. User requests https://robmclaughl.in
2. Route53 resolves to CloudFront distribution
3. CloudFront checks edge cache
   → Cache HIT: Return cached content
   → Cache MISS: Fetch from S3
4. S3 returns static files via OAC
5. CloudFront caches and returns to user
```

### 5.2 API Request Flow

```
1. User submits form/action
2. Browser sends request to API Gateway
3. API Gateway validates and routes
4. Lambda executes handler
5. Lambda reads/writes DynamoDB
6. Response returned through same path
```

### 5.3 Deployment Flow

```
1. Developer pushes to master branch
2. GitHub Actions triggered
3. Parallel execution:
   ├── Build: npm run build → /out directory
   └── Terraform: plan → apply (if changes)
4. S3 sync: Upload new files
5. CloudFront invalidation: Clear cache
6. Smoke tests (planned)
```

---

## 6. Code Organization

### 6.1 Directory Structure

```
robmclaughl.in/
├── .claude/                 # Agent documentation
│   ├── CLAUDE.md           # Master guide
│   ├── commands/           # Slash commands
│   └── subagents/          # Specialist agents
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline
├── app/                    # Next.js pages
├── components/
│   ├── ui/                 # shadcn/ui (don't modify)
│   ├── HeroBackground.tsx  # Video background
│   └── waveform.tsx        # SVG decoration
├── docs/                   # Documentation
├── hooks/                  # Custom React hooks
├── lambda_src/             # Lambda source
├── lib/                    # Utilities
├── memory-bank/            # Legacy context
├── public/                 # Static assets
├── styles/                 # Additional CSS
└── terraform/              # Infrastructure
```

### 6.2 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HeroBackground.tsx` |
| UI Components | kebab-case | `alert-dialog.tsx` |
| Hooks | use-prefix kebab | `use-toast.ts` |
| Utilities | camelCase | `utils.ts` |
| Documentation | UPPERCASE | `README.md` |
| Terraform | snake_case | `lambda_dynamodb.tf` |

---

## 7. Design Patterns

### 7.1 Component Patterns

**Client Component Pattern**
```tsx
'use client';

import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export function Component({ className, children }: Props) {
  return (
    <div className={cn("default-styles", className)}>
      {children}
    </div>
  );
}
```

**Hook Pattern**
```tsx
export function useCustomHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return { value, updateValue };
}
```

### 7.2 API Patterns

**Lambda Response Pattern**
```typescript
// Consistent response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
}
```

**Error Handling Pattern**
```typescript
try {
  // Operation
} catch (error) {
  console.error('Context:', error);
  return createResponse(500, {
    error: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

### 7.3 Infrastructure Patterns

**Conditional Resources**
```hcl
resource "aws_example" "name" {
  count = terraform.workspace == "prod" ? 1 : 0
  # Only created in production
}
```

**Module Composition**
```hcl
module "website_bucket" {
  source      = "./modules/s3"
  bucket_name = "robmclaughl-in-website-bucket"
}
```

---

## 8. Technology Stack

### 8.1 Complete Stack Reference

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** |
| Framework | Next.js | 15.1.0 | React framework with App Router |
| UI Library | React | 18.2.0 | Component library |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.4.17 | Utility-first CSS |
| Components | shadcn/ui | Latest | Radix-based UI primitives |
| Icons | lucide-react | 0.454.0 | Icon library |
| **Backend** |
| Runtime | Node.js | 20.x | Lambda runtime |
| Framework | AWS Lambda | - | Serverless compute |
| Database | DynamoDB | - | NoSQL database |
| API | API Gateway v2 | - | HTTP API |
| **Infrastructure** |
| IaC | Terraform | Latest | Infrastructure management |
| CDN | CloudFront | - | Content delivery |
| DNS | Route53 | - | Domain management |
| SSL | ACM | - | Certificate management |
| Security | WAF v2 | - | Web application firewall |
| **DevOps** |
| CI/CD | GitHub Actions | - | Automation |
| Auth | OIDC | - | AWS authentication |
| State | S3 + DynamoDB | - | Terraform state |

### 8.2 Version Pinning

- Frontend dependencies: `package.json`
- Terraform providers: `terraform/versions.tf`
- Lambda runtime: `terraform/lambda_dynamodb.tf`
- Node.js: `.nvmrc` (recommended to add)

---

## Related Documentation

- [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) - Known issues
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [SECURITY.md](./SECURITY.md) - Security requirements
- [API_INTEGRATION.md](./API_INTEGRATION.md) - External APIs

---

*Last updated: January 2026*

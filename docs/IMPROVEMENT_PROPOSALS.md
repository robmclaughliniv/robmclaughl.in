# Improvement Proposals

> Ideas and suggestions for future consideration

## Purpose

This document captures improvement ideas that:
- Don't fit current priorities
- Need further research or discussion
- Could be valuable but aren't urgent
- Came up during development but were out of scope

---

## Active Proposals

### IP-001: Migrate to Turborepo Monorepo

**Category:** Architecture
**Status:** Proposal
**Proposed By:** Initial audit

**Problem:**
As the project grows to multiple apps, managing shared code and build processes will become complex.

**Proposal:**
Restructure as a Turborepo monorepo:
```
robmclaughl.in/
├── apps/
│   ├── web/           # Main Next.js app
│   ├── vibe/          # Vibe Generator (could be separate)
│   └── lambda/        # Lambda functions
├── packages/
│   ├── ui/            # Shared UI components
│   ├── config/        # Shared configs (ESLint, TypeScript)
│   └── utils/         # Shared utilities
└── turbo.json
```

**Benefits:**
- Shared dependencies
- Cached builds
- Clear boundaries
- Easier testing

**Considerations:**
- Significant restructuring effort
- Learning curve for Turborepo
- May be overkill for current scale

**Decision:** Defer until multiple apps exist (Phase 4+)

---

### IP-002: Add Storybook for Component Documentation

**Category:** Developer Experience
**Status:** Proposal
**Proposed By:** Initial audit

**Problem:**
No visual documentation of UI components. Developers must read code to understand component APIs.

**Proposal:**
Add Storybook for component development and documentation.

**Benefits:**
- Visual component library
- Interactive documentation
- Isolated component testing
- Design system foundation

**Considerations:**
- Additional build tooling
- Maintenance overhead
- May not be needed for small team

**Decision:** Consider after UI component library grows (Phase 4)

---

### IP-003: Replace LocalStack with AWS SAM Local

**Category:** Developer Experience
**Status:** Proposal
**Proposed By:** Initial audit

**Problem:**
LocalStack setup can be complex and may not perfectly replicate AWS behavior.

**Proposal:**
Use AWS SAM CLI for local Lambda development:
```bash
sam local start-api
sam local invoke
```

**Benefits:**
- Official AWS tooling
- Better Lambda parity
- Simpler setup
- Better debugging

**Considerations:**
- Doesn't cover all AWS services
- Different from Terraform workflow
- Would need `template.yaml`

**Decision:** Research and compare for Lambda development workflow

---

### IP-004: Implement OpenTelemetry Tracing

**Category:** Observability
**Status:** Proposal
**Proposed By:** Initial audit

**Problem:**
Limited visibility into request flow across frontend and backend.

**Proposal:**
Add OpenTelemetry instrumentation:
- Frontend: Browser SDK
- Lambda: Node.js SDK
- Export to AWS X-Ray or Honeycomb

**Benefits:**
- End-to-end request tracing
- Performance insights
- Error correlation
- Cost attribution

**Considerations:**
- Additional complexity
- Potential performance overhead
- Cost of tracing backends

**Decision:** Defer until performance issues arise or traffic justifies

---

### IP-005: Add Preview Deployments

**Category:** DevOps
**Status:** Proposal
**Proposed By:** Initial audit

**Problem:**
No way to preview changes before merging to main.

**Proposal:**
Implement preview deployments for pull requests:
- Deploy PR to unique URL: `pr-123.preview.robmclaughl.in`
- Auto-comment on PR with preview URL
- Auto-cleanup after merge/close

**Implementation Options:**
1. Vercel (automatic with Next.js)
2. Netlify Deploy Previews
3. Custom S3 bucket paths + CloudFront behaviors

**Benefits:**
- Visual review of changes
- Stakeholder feedback before merge
- Catch issues early

**Considerations:**
- Additional infrastructure
- DNS/SSL complexity
- Cost for hosting previews

**Decision:** Valuable, should implement in Phase 1 or 2

---

### IP-006: Add Content Security Policy Headers

**Category:** Security
**Status:** Proposal
**Proposed By:** Initial audit

**Problem:**
No CSP headers to prevent XSS and injection attacks.

**Proposal:**
Implement strict CSP headers via CloudFront or Lambda@Edge:
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.openai.com;
```

**Benefits:**
- XSS protection
- Injection prevention
- Security best practice

**Considerations:**
- May break inline scripts/styles
- Need to whitelist external resources
- Testing complexity

**Decision:** Should implement before adding AI APIs (Phase 3)

---

### IP-007: Use React Query for API State

**Category:** Architecture
**Status:** Proposal
**Proposed By:** Initial audit

**Problem:**
No standardized approach for API data fetching and caching.

**Proposal:**
Add TanStack Query (React Query) for:
- Server state management
- Automatic caching
- Background refetching
- Loading/error states

**Example:**
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['channels'],
  queryFn: fetchChannels,
});
```

**Benefits:**
- Standardized data fetching
- Built-in caching
- Optimistic updates
- DevTools

**Considerations:**
- Additional dependency
- Learning curve
- May be overkill for simple APIs

**Decision:** Implement when adding API integrations (Phase 3)

---

### IP-008: Add Sentry Error Tracking

**Category:** Observability
**Status:** Proposal
**Proposed By:** Initial audit

**Problem:**
No visibility into frontend errors in production.

**Proposal:**
Integrate Sentry for error tracking:
- Frontend: @sentry/nextjs
- Backend: @sentry/serverless

**Benefits:**
- Real-time error alerts
- Stack traces with source maps
- Release tracking
- User impact analysis

**Considerations:**
- Sentry pricing (free tier may suffice)
- Privacy considerations
- Bundle size impact

**Decision:** Implement before public launch (Phase 2)

---

## Proposal Template

When adding new proposals, use this template:

```markdown
### IP-XXX: Title

**Category:** [Architecture | Security | DevOps | DX | Performance | Observability]
**Status:** [Proposal | Under Review | Accepted | Rejected | Implemented]
**Proposed By:** [Name or identifier]

**Problem:**
[What issue or gap does this address?]

**Proposal:**
[What is the suggested solution?]

**Benefits:**
- [Benefit 1]
- [Benefit 2]

**Considerations:**
- [Trade-off or risk 1]
- [Trade-off or risk 2]

**Decision:** [Defer | Accept | Reject | Need more info]
```

---

## Rejected Proposals

(Move rejected proposals here with reasoning)

| ID | Title | Reason |
|----|-------|--------|
| - | - | - |

---

## Implemented Proposals

(Move implemented proposals here with reference)

| ID | Title | Implemented In |
|----|-------|----------------|
| - | - | - |

---

*Last updated: January 2026*

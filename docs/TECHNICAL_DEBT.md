# Technical Debt Registry

> Tracked issues requiring resolution before expanding the codebase

## Summary

| Priority | Count | Impact |
|----------|-------|--------|
| High | 4 | Blocking quality gates and developer experience |
| Medium | 3 | Security and maintainability concerns |
| Low | 2 | Code hygiene and naming |

**Total Items**: 9

---

## High Priority

### TD-001: ESLint/TypeScript Ignored During Builds

| Attribute | Value |
|-----------|-------|
| **ID** | TD-001 |
| **Priority** | High |
| **Location** | `next.config.mjs` |
| **Impact** | Type errors and lint violations not caught |
| **Effort** | 2-4 hours |

**Current State:**
```javascript
// next.config.mjs lines 3-8
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // ...
}
```

**Problem:**
- Build succeeds even with TypeScript errors
- ESLint violations not enforced
- Code quality cannot be guaranteed
- CI/CD pipeline does not catch issues

**Resolution:**
1. Run `npm run lint` to identify all current errors
2. Fix each error type systematically
3. Remove `ignoreDuringBuilds: true`
4. Remove `ignoreBuildErrors: true`
5. Verify `npm run build` passes

**Blocked By:** May require fixing multiple files

---

### TD-002: No Test Suite

| Attribute | Value |
|-----------|-------|
| **ID** | TD-002 |
| **Priority** | High |
| **Location** | Project-wide |
| **Impact** | No automated verification of functionality |
| **Effort** | 8-16 hours (initial setup + basic coverage) |

**Current State:**
- No test files exist
- No test dependencies installed
- No test scripts in package.json

**Problem:**
- Cannot verify components work correctly
- Cannot catch regressions
- Cannot safely refactor
- No confidence in deployments

**Resolution:**
1. Install testing dependencies:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
   ```
2. Configure Vitest for Next.js
3. Add test scripts to package.json:
   ```json
   "test": "vitest",
   "test:coverage": "vitest --coverage"
   ```
4. Write initial tests for:
   - `cn()` utility function
   - Key component rendering
   - Lambda handler logic
5. Add test step to CI/CD pipeline

**Related:** AGENT_QUEUE.md - Future task for test implementation

---

### TD-003: Duplicate `use-toast` Hook

| Attribute | Value |
|-----------|-------|
| **ID** | TD-003 |
| **Priority** | High |
| **Location** | `components/ui/use-toast.ts` AND `hooks/use-toast.ts` |
| **Impact** | Import confusion, potential bundle bloat |
| **Effort** | 30 minutes |

**Current State:**
```
hooks/
  use-toast.ts          # 4142 bytes
components/ui/
  use-toast.ts          # 4142 bytes (duplicate)
```

**Problem:**
- Same file exists in two locations
- Developers may import from wrong location
- Potential for files to diverge
- Unnecessary bundle size

**Resolution:**
1. Verify both files are identical (diff)
2. Check all imports for `use-toast`
3. Update imports to use `@/hooks/use-toast`
4. Delete `components/ui/use-toast.ts`
5. Verify build succeeds

**Quick Fix:** This is a safe, quick win

---

### TD-004: Duplicate `use-mobile` Hook

| Attribute | Value |
|-----------|-------|
| **ID** | TD-004 |
| **Priority** | High |
| **Location** | `components/ui/use-mobile.tsx` AND `hooks/use-mobile.tsx` |
| **Impact** | Import confusion, potential bundle bloat |
| **Effort** | 30 minutes |

**Current State:**
```
hooks/
  use-mobile.tsx        # 584 bytes
components/ui/
  use-mobile.tsx        # 584 bytes (duplicate)
```

**Problem:**
- Same hook duplicated
- Violates project convention (hooks in `/hooks`)
- Same issues as TD-003

**Resolution:**
1. Verify both files are identical
2. Check all imports
3. Update imports to use `@/hooks/use-mobile`
4. Delete `components/ui/use-mobile.tsx`
5. Verify build succeeds

**Quick Fix:** Bundle with TD-003 for single PR

---

## Medium Priority

### TD-005: CORS Wildcard in Lambda

| Attribute | Value |
|-----------|-------|
| **ID** | TD-005 |
| **Priority** | Medium |
| **Location** | `lambda_src/src/index.ts:37` |
| **Impact** | Security - allows any origin to call API |
| **Effort** | 1 hour |

**Current State:**
```typescript
// lambda_src/src/index.ts lines 35-40
headers: {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*', // Adjust CORS policy as needed
  'Access-Control-Allow-Credentials': true,
},
```

**Problem:**
- Wildcard CORS allows any website to call the API
- `Access-Control-Allow-Credentials: true` with wildcard is invalid
- Potential for CSRF-like attacks

**Resolution:**
1. Define allowed origins list:
   ```typescript
   const ALLOWED_ORIGINS = [
     'https://robmclaughl.in',
     'https://www.robmclaughl.in',
   ];
   // Add localhost for development
   if (process.env.ENVIRONMENT === 'dev') {
     ALLOWED_ORIGINS.push('http://localhost:3000');
   }
   ```
2. Check request origin and return appropriate header
3. Return 403 for disallowed origins
4. Update API Gateway CORS configuration if needed

**Security:** Should be fixed before adding sensitive APIs

---

### TD-006: Console.log in Production

| Attribute | Value |
|-----------|-------|
| **ID** | TD-006 |
| **Priority** | Medium |
| **Location** | `components/HeroBackground.tsx` |
| **Impact** | Console noise in production, minor performance |
| **Effort** | 30 minutes |

**Current State:**
```typescript
// HeroBackground.tsx - multiple console.log statements
console.log('Video data loaded');           // line 36
console.warn('Delayed video play error:', err);  // line 43
console.warn('Video failed to load...');    // line 53
console.log('Attempting to play video...'); // line 95
console.warn('Error playing video:', error);     // line 101
console.log('Video loaded successfully');   // line 117
```

**Problem:**
- Console output visible to end users
- Development debugging code in production
- Minor performance overhead

**Resolution Options:**

**Option A: Remove all console statements**
```typescript
// Simply delete all console.log/warn statements
```

**Option B: Use environment-aware logging**
```typescript
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? console.log : () => {};
const warn = isDev ? console.warn : () => {};
```

**Option C: Create logging utility**
```typescript
// lib/logger.ts
export const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  // warn, error, etc.
};
```

**Recommended:** Option A for simplicity (component works fine without logs)

---

### TD-007: Hardcoded Route53 Zone ID

| Attribute | Value |
|-----------|-------|
| **ID** | TD-007 |
| **Priority** | Medium |
| **Location** | `terraform/main.tf:199` |
| **Impact** | Less flexible infrastructure, harder to clone |
| **Effort** | 30 minutes |

**Current State:**
```hcl
# terraform/main.tf line 199
module "route53" {
  # ...
  zone_id     = "Z2PPIVE6CKK74T" # Pass the correct Zone ID directly
  # ...
}
```

**Problem:**
- Zone ID hardcoded in configuration
- Cannot easily replicate infrastructure
- Not documented why this specific value

**Resolution:**
1. Move to variables file:
   ```hcl
   # variables.tf
   variable "route53_zone_id" {
     description = "Route53 hosted zone ID for domain"
     type        = string
     default     = "Z2PPIVE6CKK74T"
   }
   ```
2. Update module reference:
   ```hcl
   zone_id = var.route53_zone_id
   ```
3. Document in terraform/README.md

---

## Low Priority

### TD-008: Package Name "my-v0-project"

| Attribute | Value |
|-----------|-------|
| **ID** | TD-008 |
| **Priority** | Low |
| **Location** | `package.json:2` |
| **Impact** | Cosmetic, may cause confusion |
| **Effort** | 5 minutes |

**Current State:**
```json
{
  "name": "my-v0-project",
  // ...
}
```

**Problem:**
- Name doesn't reflect project
- Suggests this was scaffolded from v0.dev
- May cause npm issues if publishing

**Resolution:**
```json
{
  "name": "robmclaughl-in",
  // ...
}
```

---

### TD-009: Missing React Error Boundaries

| Attribute | Value |
|-----------|-------|
| **ID** | TD-009 |
| **Priority** | Low |
| **Location** | Project-wide |
| **Impact** | Entire app crashes on component error |
| **Effort** | 2-3 hours |

**Current State:**
- No ErrorBoundary components
- Component errors crash entire page

**Problem:**
- Single component failure brings down whole app
- Poor user experience on errors
- No graceful degradation

**Resolution:**
1. Create ErrorBoundary component:
   ```tsx
   // components/ErrorBoundary.tsx
   'use client';

   import { Component, ReactNode } from 'react';

   interface Props {
     children: ReactNode;
     fallback?: ReactNode;
   }

   interface State {
     hasError: boolean;
   }

   export class ErrorBoundary extends Component<Props, State> {
     state = { hasError: false };

     static getDerivedStateFromError() {
       return { hasError: true };
     }

     componentDidCatch(error: Error, info: React.ErrorInfo) {
       console.error('Error caught:', error, info);
     }

     render() {
       if (this.state.hasError) {
         return this.props.fallback || <div>Something went wrong</div>;
       }
       return this.props.children;
     }
   }
   ```
2. Wrap key sections in layout
3. Add app-specific error UI matching CRT aesthetic

---

## Resolution Tracking

| ID | Status | Assignee | PR | Notes |
|----|--------|----------|-----|-------|
| TD-001 | Open | - | - | Requires error audit first |
| TD-002 | Open | - | - | Large task, can be incremental |
| TD-003 | Open | - | - | Quick win |
| TD-004 | Open | - | - | Bundle with TD-003 |
| TD-005 | Open | - | - | Security priority |
| TD-006 | Open | - | - | Quick win |
| TD-007 | Open | - | - | Low effort |
| TD-008 | Open | - | - | Trivial |
| TD-009 | Open | - | - | Nice to have |

---

## Quick Wins

These can be fixed immediately with minimal risk:

1. **TD-003 + TD-004**: Remove duplicate hooks (< 1 hour combined)
2. **TD-006**: Remove console.log statements (30 minutes)
3. **TD-008**: Fix package name (5 minutes)

**Suggested first PR**: Combine TD-003, TD-004, TD-006, TD-008 for immediate cleanup.

---

## Adding New Debt

When identifying new technical debt:

1. Assign next available ID (TD-010, etc.)
2. Determine priority (High/Medium/Low)
3. Document location, impact, and resolution
4. Update summary counts
5. Consider adding to AGENT_QUEUE.md if actionable

---

*Last updated: January 2026*

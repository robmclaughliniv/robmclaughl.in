# Performance Budgets

> Resource limits to maintain fast page loads

## What Are Performance Budgets?

Performance budgets are limits you set on metrics that affect site performance. They:
- Prevent performance regression during development
- Create accountability for performance
- Guide decisions about adding features/dependencies
- Enable automated performance testing in CI/CD

---

## Budget Categories

### 1. JavaScript Budget

JavaScript is typically the biggest performance bottleneck.

| Metric | Budget | Rationale |
|--------|--------|-----------|
| **Total JS (gzipped)** | <200 KB | Mobile 3G can download in ~3s |
| **Initial bundle** | <100 KB | First load should be fast |
| **Per-route chunk** | <50 KB | Route changes should be instant |
| **Third-party scripts** | <50 KB | Keep external scripts minimal |

#### Why These Numbers?

- **200 KB gzipped ≈ 800 KB uncompressed**
- Parsing/compiling 800 KB JS takes ~2-4s on average mobile devices
- Each additional 100 KB adds ~1s to Time to Interactive

#### Enforcement Strategy

```javascript
// next.config.js - experimental bundle size limits
module.exports = {
  experimental: {
    // Will warn if exceeded
    largePageDataBytes: 128 * 1024, // 128 KB
  },
};
```

```javascript
// bundlesize config
{
  "bundlesize": [
    {
      "path": "./out/_next/static/chunks/*.js",
      "maxSize": "50 KB"
    },
    {
      "path": "./out/_next/static/chunks/pages/*.js",
      "maxSize": "100 KB"
    }
  ]
}
```

---

### 2. CSS Budget

| Metric | Budget | Rationale |
|--------|--------|-----------|
| **Total CSS** | <50 KB | Render-blocking, must be small |
| **Critical CSS (inlined)** | <14 KB | Fits in first TCP round trip |
| **Per-component CSS** | <5 KB | Scoped styles should be tiny |

#### Why These Numbers?

- CSS is render-blocking by default
- 14 KB fits in the first TCP congestion window (most efficient)
- Tailwind CSS with purging typically produces <10 KB

#### Optimization Tips

```css
/* Before: 5 KB */
.btn { /* base styles */ }
.btn-primary { /* primary styles */ }
.btn-secondary { /* secondary styles */ }
.btn-lg { /* large styles */ }
.btn-sm { /* small styles */ }
/* ... 50 more variants */

/* After: 1 KB (use Tailwind) */
/* Classes generated on-demand */
```

---

### 3. Image Budget

| Metric | Budget | Rationale |
|--------|--------|-----------|
| **Individual image** | <100 KB | Balance quality vs. speed |
| **Hero/background image** | <200 KB | Exception for important visuals |
| **Icon** | <5 KB | Should be tiny |
| **Total images per page** | <500 KB | Keep overall payload reasonable |

#### Format Guidelines

| Format | Use Case | Typical Savings |
|--------|----------|-----------------|
| **WebP** | Photos, complex graphics | 25-35% vs JPEG |
| **AVIF** | Same, with modern browsers | 50-70% vs JPEG |
| **SVG** | Icons, simple graphics | Infinitely scalable |
| **PNG** | Graphics needing transparency | Use WebP when possible |

#### Implementation

```typescript
// Next.js automatic optimization
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  quality={75}  // Default 75, adjust as needed
  priority      // Preload above-fold images
/>
```

```html
<!-- Manual picture element with fallbacks -->
<picture>
  <source srcset="/hero.avif" type="image/avif">
  <source srcset="/hero.webp" type="image/webp">
  <img src="/hero.jpg" alt="Hero" width="1200" height="600">
</picture>
```

---

### 4. Font Budget

| Metric | Budget | Rationale |
|--------|--------|-----------|
| **Total fonts** | <50 KB | Fonts block text rendering |
| **Per font family** | <25 KB | Subset aggressively |
| **Number of font files** | <4 | Reduce HTTP requests |

#### Optimization Strategies

1. **Subset fonts** - Only include characters you use
2. **Use WOFF2** - Best compression for web
3. **Preload critical fonts** - Reduce FOIT
4. **Use font-display: swap** - Show fallback immediately

```css
@font-face {
  font-family: 'Custom Font';
  src: url('/fonts/custom-subset.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;  /* Show fallback immediately */
}
```

```html
<!-- Preload critical fonts -->
<link
  rel="preload"
  href="/fonts/custom-subset.woff2"
  as="font"
  type="font/woff2"
  crossorigin
>
```

---

### 5. Third-Party Script Budget

| Metric | Budget | Rationale |
|--------|--------|-----------|
| **Total third-party** | <50 KB | External scripts are unpredictable |
| **Individual script** | <20 KB | Minimize per-script impact |
| **Number of third-parties** | <5 | Fewer vendors = less risk |

#### Common Third-Party Scripts (Approximate Sizes)

| Script | Size (gzipped) | Impact |
|--------|----------------|--------|
| Google Analytics 4 | ~45 KB | Moderate |
| Google Tag Manager | ~30 KB | Moderate |
| Intercom | ~200 KB | High |
| Drift | ~150 KB | High |
| HubSpot | ~100 KB | High |
| Hotjar | ~50 KB | Moderate |

#### Mitigation Strategies

```html
<!-- Load analytics after page load -->
<script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_ID';
      document.head.appendChild(script);
    }, 2000);  // Delay 2s after load
  });
</script>

<!-- Use facades for chat widgets -->
<button onclick="loadIntercom()">
  Chat with us
</button>
```

---

### 6. Core Web Vitals Budget

| Metric | Budget | Stretch Goal |
|--------|--------|--------------|
| **LCP** | <2.5s | <1.8s |
| **CLS** | <0.1 | <0.05 |
| **INP** | <200ms | <100ms |
| **TBT** | <200ms | <100ms |
| **FCP** | <1.8s | <1.2s |
| **TTI** | <3.8s | <2.5s |

---

## Budget Implementation

### 1. Document Budgets

Create a `PERFORMANCE_BUDGET.md` or add to project config:

```json
// performance-budget.json
{
  "budgets": {
    "javascript": {
      "total_gzip_kb": 200,
      "initial_bundle_kb": 100,
      "chunk_kb": 50
    },
    "css": {
      "total_kb": 50,
      "critical_kb": 14
    },
    "images": {
      "individual_kb": 100,
      "hero_kb": 200,
      "total_page_kb": 500
    },
    "fonts": {
      "total_kb": 50
    },
    "core_web_vitals": {
      "lcp_ms": 2500,
      "cls": 0.1,
      "inp_ms": 200
    }
  }
}
```

### 2. CI/CD Integration

```yaml
# GitHub Actions example
name: Performance Budget Check

on: [push, pull_request]

jobs:
  budget-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Check bundle size
        run: npx bundlesize

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          budgetPath: ./budget.json
          uploadArtifacts: true
```

### 3. Pre-commit Hooks

```json
// package.json
{
  "scripts": {
    "check-bundle": "bundlesize",
    "precommit": "npm run check-bundle"
  }
}
```

---

## Budget Exceptions

Sometimes budgets need exceptions. Document them:

```markdown
## Budget Exceptions

### Hero Video (500KB)
- **Reason:** Critical for brand identity
- **Mitigation:** Lazy loaded, compressed, has poster image
- **Approved by:** [Name] on [Date]
- **Review date:** [Date]

### Charting Library (150KB)
- **Reason:** Required for data visualization feature
- **Mitigation:** Code split, only loaded on /analytics route
- **Approved by:** [Name] on [Date]
- **Review date:** [Date]
```

---

## Monitoring & Alerts

Set up alerts when budgets are exceeded:

```typescript
// Example: Report to monitoring service
async function reportBudgetViolation(violation: BudgetViolation) {
  await fetch('/api/metrics', {
    method: 'POST',
    body: JSON.stringify({
      type: 'budget_violation',
      metric: violation.metric,
      budget: violation.budget,
      actual: violation.actual,
      exceeded_by: violation.exceededBy,
      timestamp: Date.now(),
    }),
  });
}
```

---

## Budget Review Process

1. **Monthly Review**
   - Check if budgets are being met
   - Identify trends (growing or shrinking)
   - Adjust budgets if justified

2. **Before Major Features**
   - Estimate impact on budgets
   - Plan mitigation if budget will be exceeded
   - Get approval for exceptions

3. **Quarterly Audit**
   - Full performance audit
   - Review all exceptions
   - Update budgets based on industry standards

---

## Resources

- [Performance Budget Calculator](https://perf-budget-calculator.firebaseapp.com/)
- [bundlesize](https://github.com/siddharthkp/bundlesize)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [SpeedCurve Performance Budgets](https://www.speedcurve.com/blog/performance-budgets/)

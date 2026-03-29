# Performance Report Template

> Copy this template and fill in the sections after running performance audits

---

# Performance Audit Report

**Date:** YYYY-MM-DD
**URL:** https://example.com
**Auditor:** [Agent/Person Name]
**Tools Used:** Lighthouse, Bundle Analyzer, Image Optimizer

---

## Executive Summary

[1-2 paragraph summary of findings and recommendations]

**Overall Status:** 🟢 Healthy / 🟡 Needs Attention / 🔴 Critical Issues

**Key Metrics:**
| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| Performance Score | XX/100 | >90 | 🟢/🟡/🔴 |
| LCP | X.Xs | <2.5s | 🟢/🟡/🔴 |
| CLS | X.XX | <0.1 | 🟢/🟡/🔴 |
| INP | XXXms | <200ms | 🟢/🟡/🔴 |
| Total JS | XXX KB | <200 KB | 🟢/🟡/🔴 |
| Total CSS | XX KB | <50 KB | 🟢/🟡/🔴 |

---

## Core Web Vitals

### LCP (Largest Contentful Paint)
- **Score:** X.Xs
- **Target:** <2.5s
- **Status:** 🟢/🟡/🔴
- **LCP Element:** [Describe the element]

**Issues Found:**
- [Issue 1]
- [Issue 2]

**Recommendations:**
- [Recommendation 1]
- [Recommendation 2]

### CLS (Cumulative Layout Shift)
- **Score:** X.XX
- **Target:** <0.1
- **Status:** 🟢/🟡/🔴

**Layout Shift Sources:**
- [Element/cause 1]
- [Element/cause 2]

**Recommendations:**
- [Recommendation 1]
- [Recommendation 2]

### INP (Interaction to Next Paint)
- **Score:** XXXms
- **Target:** <200ms
- **Status:** 🟢/🟡/🔴

**Slow Interactions:**
- [Interaction 1]
- [Interaction 2]

**Recommendations:**
- [Recommendation 1]
- [Recommendation 2]

---

## Bundle Analysis

### JavaScript
| Bundle | Size (gzip) | Budget | Status |
|--------|-------------|--------|--------|
| Total | XXX KB | 200 KB | 🟢/🔴 |
| Initial | XXX KB | 100 KB | 🟢/🔴 |
| [chunk-name] | XX KB | 50 KB | 🟢/🔴 |

**Largest Dependencies:**
1. [dependency-1]: XX KB
2. [dependency-2]: XX KB
3. [dependency-3]: XX KB

**Recommendations:**
- [Recommendation 1]
- [Recommendation 2]

### CSS
| File | Size | Budget | Status |
|------|------|--------|--------|
| Total | XX KB | 50 KB | 🟢/🔴 |
| [file.css] | XX KB | - | - |

**Unused CSS Findings:**
- [Finding 1]
- [Finding 2]

---

## Image Analysis

**Total Images:** XX
**Total Size:** XXX KB
**Potential Savings:** ~XXX KB

### Oversized Images
| Image | Current Size | Recommended | Savings |
|-------|--------------|-------------|---------|
| [image-1.jpg] | XXX KB | <100 KB | ~XX KB |
| [image-2.png] | XXX KB | <100 KB | ~XX KB |

### Format Recommendations
| Image | Current | Recommended | Est. Savings |
|-------|---------|-------------|--------------|
| [image-1.jpg] | JPEG | WebP | ~30% |
| [image-2.png] | PNG | WebP | ~40% |

### Missing Optimizations
- [ ] Images without explicit dimensions
- [ ] Images without lazy loading
- [ ] Images not using modern formats

---

## Critical Issues 🔴

Issues requiring immediate attention:

### Issue 1: [Title]
**Impact:** [High/Critical]
**Metric Affected:** [LCP/CLS/INP/Bundle Size]

**Current State:**
```
[Code or description of current state]
```

**Recommended Fix:**
```
[Code or description of fix]
```

**Estimated Impact:** [e.g., "Improves LCP by ~500ms"]

---

### Issue 2: [Title]
[Same format as above]

---

## High Priority Issues 🟡

Issues to address before shipping:

### Issue 1: [Title]
**Impact:** Medium-High
**Metric Affected:** [Metric]

**Description:**
[Description of issue]

**Recommended Fix:**
[Fix description]

**Estimated Impact:** [Impact description]

---

## Medium Priority Issues 🟢

Issues to plan for future sprints:

1. **[Issue title]** - [Brief description]
2. **[Issue title]** - [Brief description]
3. **[Issue title]** - [Brief description]

---

## Low Priority Issues 🔵

Nice-to-have optimizations:

1. **[Issue title]** - [Brief description]
2. **[Issue title]** - [Brief description]

---

## Recommendations Summary

### Immediate Actions (This Sprint)
- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]

### Short-term (Next Sprint)
- [ ] [Action 1]
- [ ] [Action 2]

### Long-term (Backlog)
- [ ] [Action 1]
- [ ] [Action 2]

---

## Budget Compliance

| Category | Budget | Actual | Status | Trend |
|----------|--------|--------|--------|-------|
| Total JS (gzip) | 200 KB | XXX KB | 🟢/🔴 | ↑/↓/→ |
| Initial Bundle | 100 KB | XXX KB | 🟢/🔴 | ↑/↓/→ |
| Total CSS | 50 KB | XX KB | 🟢/🔴 | ↑/↓/→ |
| Images/page | 500 KB | XXX KB | 🟢/🔴 | ↑/↓/→ |
| Fonts | 50 KB | XX KB | 🟢/🔴 | ↑/↓/→ |
| Third-party | 50 KB | XX KB | 🟢/🔴 | ↑/↓/→ |

---

## Comparison with Previous Audit

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Performance Score | XX | XX | +X/-X |
| LCP | X.Xs | X.Xs | +Xms/-Xms |
| CLS | X.XX | X.XX | +X.XX/-X.XX |
| INP | XXXms | XXXms | +Xms/-Xms |
| Bundle Size | XXX KB | XXX KB | +XX/-XX KB |

---

## Appendix

### A. Raw Lighthouse Data
[Link or embedded JSON]

### B. Bundle Analysis Details
[Detailed breakdown]

### C. Testing Environment
- **Device:** [Desktop/Mobile/Both]
- **Connection:** [Fast 3G/4G/Broadband]
- **Browser:** [Chrome XX]
- **Location:** [Geographic location]

### D. References
- [Link to relevant documentation]
- [Link to related issues/PRs]

---

*Report generated with web-performance skill*
*Last updated: YYYY-MM-DD*

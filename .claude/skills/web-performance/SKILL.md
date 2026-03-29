# Web Performance Skill

> Web performance toolkit with scripts for Lighthouse audits, bundle analysis, image optimization, and Core Web Vitals tracking.

## When to Use

- **Building features** - Run audits before/after to measure impact
- **Before shipping** - Verify performance budgets are met
- **Investigating issues** - Diagnose slow pages or high resource usage
- **Regular maintenance** - Periodic performance health checks

## Quick Start

```bash
# Full performance audit (recommended)
python .claude/skills/web-performance/scripts/lighthouse-audit.py http://localhost:3000

# Analyze bundle sizes
python .claude/skills/web-performance/scripts/bundle-analyzer.py

# Check image optimization
python .claude/skills/web-performance/scripts/image-optimizer.py ./public

# Find unused CSS
python .claude/skills/web-performance/scripts/unused-css.py
```

## Scripts

### 1. Lighthouse Audit (`scripts/lighthouse-audit.py`)

Runs Lighthouse programmatically and extracts Core Web Vitals.

```bash
python .claude/skills/web-performance/scripts/lighthouse-audit.py <url>

# Examples:
python .claude/skills/web-performance/scripts/lighthouse-audit.py http://localhost:3000
python .claude/skills/web-performance/scripts/lighthouse-audit.py https://robmclaughl.in
```

**Output:**
- Performance score (0-100)
- LCP, CLS, INP, TBT, FCP, SI metrics
- Pass/fail status for each metric
- Specific issues and recommendations

**Thresholds:**
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | <2.5s | 2.5-4.0s | >4.0s |
| CLS | <0.1 | 0.1-0.25 | >0.25 |
| INP | <200ms | 200-500ms | >500ms |
| TBT | <200ms | 200-600ms | >600ms |

### 2. Bundle Analyzer (`scripts/bundle-analyzer.py`)

Analyzes JavaScript and CSS bundle sizes in build output.

```bash
python .claude/skills/web-performance/scripts/bundle-analyzer.py

# Analyzes ./out directory by default (Next.js static export)
# Also checks .next/static for development builds
```

**Output:**
- Total bundle size (raw and gzipped)
- Per-file breakdown sorted by size
- Largest dependencies identified
- Budget violations flagged

**Budgets:**
| Asset Type | Budget |
|------------|--------|
| Total JS (gzipped) | <200KB |
| Initial bundle | <100KB |
| Individual chunk | <50KB |
| Total CSS | <50KB |

### 3. Image Optimizer (`scripts/image-optimizer.py`)

Scans images for optimization opportunities.

```bash
python .claude/skills/web-performance/scripts/image-optimizer.py <directory>

# Examples:
python .claude/skills/web-performance/scripts/image-optimizer.py ./public
python .claude/skills/web-performance/scripts/image-optimizer.py ./public/images
```

**Checks:**
- Images >100KB that should be optimized
- Images not in WebP/AVIF format
- Missing width/height attributes in code
- Missing lazy loading for below-fold images
- Oversized images (dimensions > display size)

**Output:**
- List of images needing optimization
- Estimated savings per image
- Conversion recommendations
- Code snippets for proper implementation

### 4. Unused CSS (`scripts/unused-css.py`)

Identifies potentially unused CSS rules.

```bash
python .claude/skills/web-performance/scripts/unused-css.py
```

**Checks:**
- CSS selectors not found in HTML/JSX/TSX files
- Duplicate CSS rules
- Overly specific selectors that could be simplified
- Large CSS files that could be split

**Output:**
- Potentially unused selectors
- File-by-file breakdown
- Recommendations for removal or PurgeCSS integration

## Interpreting Results

### Severity Levels

| Level | Icon | Meaning | Action |
|-------|------|---------|--------|
| Critical | 🔴 | Major performance issue | Fix immediately |
| High | 🟡 | Significant impact | Fix before shipping |
| Medium | 🟢 | Moderate impact | Plan to fix |
| Low | 🔵 | Minor optimization | Nice to have |

### Score Interpretation

| Score | Rating | Meaning |
|-------|--------|---------|
| 90-100 | Excellent | Top-tier performance |
| 70-89 | Good | Room for improvement |
| 50-69 | Needs Work | Noticeable issues |
| 0-49 | Poor | Critical problems |

## Performance Budgets for This Project

This project (robmclaughl.in) has specific budgets:

### JavaScript
- **Total (gzipped):** <200KB
- **Initial bundle:** <100KB
- **Per-route chunk:** <50KB

### CSS
- **Total:** <50KB
- **Critical CSS:** <14KB (inlined)
- **Per-component:** <5KB

### Images
- **Individual image:** <100KB
- **Hero/background:** <200KB (exception)
- **Icons:** <5KB each
- **Format:** WebP preferred, AVIF for modern browsers

### Fonts
- **Total:** <50KB
- **Per font family:** <25KB
- **Strategy:** font-display: swap, subset characters

### Third-Party Scripts
- **Total:** <50KB
- **Individual script:** <20KB
- **Load strategy:** async/defer, lazy load when possible

### Core Web Vitals Targets
- **LCP:** <2.5s (target: <1.8s)
- **CLS:** <0.1 (target: <0.05)
- **INP:** <200ms (target: <100ms)

## Reference Documentation

- `reference/core-web-vitals.md` - Deep dive into CWV metrics
- `reference/performance-budgets.md` - Detailed budget rationale
- `reference/optimization-techniques.md` - How to fix common issues

## Report Template

Use `templates/performance-report.md` for standardized reporting.

## Integration with Workflow

### Before Shipping
```bash
# Run full audit before any deployment
python .claude/skills/web-performance/scripts/lighthouse-audit.py http://localhost:3000
python .claude/skills/web-performance/scripts/bundle-analyzer.py
```

### During Development
```bash
# Quick checks during feature development
python .claude/skills/web-performance/scripts/bundle-analyzer.py
python .claude/skills/web-performance/scripts/image-optimizer.py ./public
```

### CI/CD Integration
These scripts can be integrated into GitHub Actions:
```yaml
- name: Performance Audit
  run: |
    python .claude/skills/web-performance/scripts/bundle-analyzer.py
    # Fail if budget exceeded
```

## Troubleshooting

### Script Requirements

The scripts require Python 3.8+ and may need additional packages:
```bash
pip install requests beautifulsoup4
```

For Lighthouse audits, you also need:
```bash
npm install -g lighthouse
```

### Common Issues

**"lighthouse not found"**
- Install globally: `npm install -g lighthouse`
- Or use npx: Scripts will fall back to `npx lighthouse`

**"Permission denied"**
- Ensure scripts are executable: `chmod +x scripts/*.py`

**"No build output found"**
- Run `npm run build` first to generate the output directory

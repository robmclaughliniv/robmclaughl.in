# Core Web Vitals Reference

> Google's essential metrics for measuring user experience

## Overview

Core Web Vitals are a set of specific metrics that Google considers essential for delivering a great user experience. They measure:

1. **Loading** - How fast content appears
2. **Interactivity** - How quickly the page responds
3. **Visual Stability** - How much the layout shifts

These metrics directly impact:
- SEO rankings (Google ranking factor since 2021)
- User engagement and conversion rates
- Bounce rates and session duration

---

## LCP - Largest Contentful Paint

### What It Measures
The time it takes for the largest visible content element to render.

### Targets
| Rating | Time | User Experience |
|--------|------|-----------------|
| 🟢 Good | <2.5s | Excellent - user sees content quickly |
| 🟡 Needs Improvement | 2.5-4.0s | Acceptable but could be better |
| 🔴 Poor | >4.0s | Frustrating - users may abandon |

**Ideal target: <1.8s**

### What Counts as LCP Element
- `<img>` elements
- `<video>` poster images
- Elements with `background-image` via CSS
- Block-level elements with text nodes

### Common Causes of Poor LCP

1. **Slow server response time**
   - Server takes too long to respond
   - Fix: Improve server performance, use CDN

2. **Render-blocking resources**
   - CSS and JS blocking first paint
   - Fix: Inline critical CSS, defer non-critical JS

3. **Slow resource load times**
   - Large images, fonts, or scripts
   - Fix: Optimize images, preload key resources

4. **Client-side rendering**
   - Content rendered by JavaScript
   - Fix: Server-side render critical content

### How to Improve LCP

```html
<!-- Preload the LCP image -->
<link rel="preload" as="image" href="/hero-image.webp">

<!-- Use fetchpriority for hero images -->
<img src="/hero.webp" fetchpriority="high" alt="Hero">

<!-- Inline critical CSS -->
<style>
  /* Critical styles for above-the-fold content */
</style>
```

```typescript
// Next.js: Use priority prop for LCP images
import Image from 'next/image';

<Image
  src="/hero.webp"
  alt="Hero"
  priority  // Preloads image
  width={1200}
  height={600}
/>
```

---

## CLS - Cumulative Layout Shift

### What It Measures
The sum of all unexpected layout shifts that occur during the page lifecycle.

### Targets
| Rating | Score | User Experience |
|--------|-------|-----------------|
| 🟢 Good | <0.1 | Stable - content doesn't jump |
| 🟡 Needs Improvement | 0.1-0.25 | Some noticeable shifts |
| 🔴 Poor | >0.25 | Frustrating - content jumps around |

**Ideal target: <0.05**

### What Causes Layout Shifts

1. **Images without dimensions**
   - Browser doesn't reserve space
   - Fix: Always set width and height

2. **Ads, embeds, iframes**
   - Content injected after load
   - Fix: Reserve space with CSS

3. **Dynamically injected content**
   - Elements added above existing content
   - Fix: Add below viewport or with reserved space

4. **Web fonts causing FOIT/FOUT**
   - Font swap changes text size
   - Fix: Use `font-display: optional` or match fallback metrics

5. **Actions waiting for network**
   - UI updates delayed by API calls
   - Fix: Use optimistic updates or skeleton loaders

### How to Prevent CLS

```html
<!-- Always include dimensions -->
<img src="/photo.jpg" width="800" height="600" alt="Photo">

<!-- Reserve space for ads -->
<div style="min-height: 250px;">
  <!-- Ad loads here -->
</div>
```

```css
/* Prevent font-swap layout shift */
@font-face {
  font-family: 'Custom Font';
  font-display: optional; /* or swap with matched fallback */
}

/* Reserve space for dynamic content */
.skeleton {
  min-height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  animation: shimmer 1.5s infinite;
}
```

```typescript
// Next.js Image handles dimensions automatically
import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"  // Prevents shift with blur-up
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

## INP - Interaction to Next Paint

### What It Measures
The latency of all user interactions (clicks, taps, keyboard) throughout the page lifecycle.

**Note:** INP replaced FID (First Input Delay) as a Core Web Vital in March 2024.

### Targets
| Rating | Time | User Experience |
|--------|------|-----------------|
| 🟢 Good | <200ms | Responsive - feels instant |
| 🟡 Needs Improvement | 200-500ms | Noticeable delay |
| 🔴 Poor | >500ms | Sluggish - frustrating |

**Ideal target: <100ms**

### What Counts as Interactions
- Mouse clicks
- Taps on touch screens
- Key presses (both physical and on-screen keyboards)

**Not counted:** Scrolling, hovering, zooming

### Common Causes of Poor INP

1. **Long JavaScript tasks**
   - JS blocking main thread >50ms
   - Fix: Break up long tasks, use web workers

2. **Heavy event handlers**
   - Expensive operations on user input
   - Fix: Debounce, optimize, or defer

3. **Large DOM size**
   - More elements = slower updates
   - Fix: Virtualize lists, reduce DOM nodes

4. **Layout thrashing**
   - Multiple forced reflows
   - Fix: Batch DOM reads/writes

### How to Improve INP

```typescript
// Break up long tasks
async function processLargeData(items: Item[]) {
  for (let i = 0; i < items.length; i++) {
    process(items[i]);

    // Yield to main thread every 50 items
    if (i % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// Debounce expensive operations
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  }) as T;
}

const handleSearch = debounce((query: string) => {
  // Expensive search operation
}, 300);
```

```typescript
// Use startTransition for non-urgent updates
import { startTransition } from 'react';

function handleClick() {
  // Urgent: update button state immediately
  setIsLoading(true);

  // Non-urgent: can be interrupted
  startTransition(() => {
    setSearchResults(computeResults());
  });
}
```

---

## TBT - Total Blocking Time

### What It Measures
The total time between FCP and TTI where the main thread was blocked long enough to prevent input responsiveness.

### Targets
| Rating | Time | Correlation |
|--------|------|-------------|
| 🟢 Good | <200ms | Good INP likely |
| 🟡 Needs Improvement | 200-600ms | INP at risk |
| 🔴 Poor | >600ms | Poor INP likely |

**Note:** TBT is a lab metric that correlates with INP (field metric).

### What Causes High TBT

1. **Large JavaScript bundles**
   - More code = more parsing/execution time
   - Fix: Code split, tree shake, lazy load

2. **Third-party scripts**
   - Analytics, ads, chat widgets
   - Fix: Load asynchronously, use facades

3. **Inefficient JavaScript**
   - Unoptimized loops, excessive DOM manipulation
   - Fix: Optimize algorithms, batch updates

### How to Reduce TBT

```html
<!-- Defer non-critical scripts -->
<script src="/analytics.js" defer></script>

<!-- Use async for independent scripts -->
<script src="/widget.js" async></script>

<!-- Load third-party scripts on interaction -->
<script>
  document.addEventListener('scroll', () => {
    loadChatWidget();
  }, { once: true });
</script>
```

```typescript
// Dynamic imports for code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,  // Skip SSR if not needed
});

// Lazy load below-fold components
const Comments = dynamic(() => import('./Comments'), {
  loading: () => <div>Loading comments...</div>,
});
```

---

## Measuring Core Web Vitals

### Lab Tools (Simulated)
- Lighthouse (Chrome DevTools)
- PageSpeed Insights
- WebPageTest

### Field Tools (Real Users)
- Chrome User Experience Report (CrUX)
- web-vitals JavaScript library
- Search Console Core Web Vitals report

### Measuring in Code

```typescript
import { onLCP, onCLS, onINP, onTTFB, onFCP } from 'web-vitals';

// Report to analytics
function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta,
    rating: metric.rating,
  });

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/analytics', body);
  } else {
    fetch('/analytics', { body, method: 'POST', keepalive: true });
  }
}

onLCP(sendToAnalytics);
onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onTTFB(sendToAnalytics);
onFCP(sendToAnalytics);
```

---

## Quick Reference Card

| Metric | Good | Needs Work | Poor | Measures |
|--------|------|------------|------|----------|
| **LCP** | <2.5s | 2.5-4.0s | >4.0s | Loading |
| **CLS** | <0.1 | 0.1-0.25 | >0.25 | Visual Stability |
| **INP** | <200ms | 200-500ms | >500ms | Interactivity |
| **TBT** | <200ms | 200-600ms | >600ms | Main Thread |
| **FCP** | <1.8s | 1.8-3.0s | >3.0s | First Paint |
| **TTFB** | <800ms | 800-1800ms | >1800ms | Server Response |

---

## Resources

- [web.dev Core Web Vitals](https://web.dev/vitals/)
- [Chrome UX Report](https://developer.chrome.com/docs/crux/)
- [web-vitals library](https://github.com/GoogleChrome/web-vitals)
- [PageSpeed Insights](https://pagespeed.web.dev/)

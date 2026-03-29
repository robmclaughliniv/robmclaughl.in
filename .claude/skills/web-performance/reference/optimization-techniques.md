# Optimization Techniques

> Practical techniques for improving web performance

## Overview

This guide covers optimization techniques organized by category:
1. [Code Splitting](#1-code-splitting)
2. [Image Optimization](#2-image-optimization)
3. [JavaScript Optimization](#3-javascript-optimization)
4. [CSS Optimization](#4-css-optimization)
5. [Network Optimization](#5-network-optimization)
6. [Rendering Optimization](#6-rendering-optimization)

---

## 1. Code Splitting

Split your code into smaller chunks that load on demand.

### Route-Based Splitting (Next.js)

Next.js automatically splits by route. Each page is its own chunk.

```typescript
// pages/dashboard.tsx - automatically separate chunk
export default function Dashboard() {
  return <div>Dashboard</div>;
}

// app/dashboard/page.tsx - App Router also auto-splits
export default function Dashboard() {
  return <div>Dashboard</div>;
}
```

### Component-Based Splitting

```typescript
import dynamic from 'next/dynamic';

// Heavy component loaded only when needed
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // Skip server rendering if not needed
});

// Load on user interaction
const CommentSection = dynamic(() => import('@/components/Comments'), {
  loading: () => <p>Loading comments...</p>,
});

export default function Page() {
  const [showComments, setShowComments] = useState(false);

  return (
    <div>
      <HeavyChart data={data} />

      <button onClick={() => setShowComments(true)}>
        Show Comments
      </button>

      {showComments && <CommentSection />}
    </div>
  );
}
```

### Library Splitting

```typescript
// Before: imports entire library
import { format, parse, add, sub } from 'date-fns';

// After: import only what you need
import format from 'date-fns/format';
import parse from 'date-fns/parse';

// Or use dynamic import for rarely-used features
async function handleExport() {
  const { exportToPDF } = await import('@/lib/export');
  await exportToPDF(data);
}
```

---

## 2. Image Optimization

### Format Selection

| Format | Best For | Browser Support |
|--------|----------|-----------------|
| **AVIF** | Photos, high compression | Chrome 85+, Firefox 93+ |
| **WebP** | Photos, universal | All modern browsers |
| **SVG** | Icons, logos, simple graphics | All browsers |
| **PNG** | Graphics with transparency | All browsers |

### Next.js Image Component

```typescript
import Image from 'next/image';

// Basic usage - automatic optimization
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
/>

// Priority for LCP images
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority  // Preloads image, removes lazy loading
/>

// Responsive images
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>

// With blur placeholder
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>
```

### Lazy Loading

```html
<!-- Native lazy loading -->
<img src="/image.jpg" loading="lazy" alt="Description">

<!-- With Intersection Observer for more control -->
<img data-src="/image.jpg" class="lazy" alt="Description">
```

```typescript
// Intersection Observer implementation
function lazyLoadImages() {
  const images = document.querySelectorAll('img.lazy');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src!;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px',  // Start loading 50px before visible
  });

  images.forEach(img => observer.observe(img));
}
```

### Responsive Images

```html
<!-- srcset for different resolutions -->
<img
  src="/image-800.jpg"
  srcset="
    /image-400.jpg 400w,
    /image-800.jpg 800w,
    /image-1200.jpg 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  alt="Responsive image"
>

<!-- picture element for art direction -->
<picture>
  <source media="(max-width: 600px)" srcset="/mobile.jpg">
  <source media="(max-width: 1000px)" srcset="/tablet.jpg">
  <img src="/desktop.jpg" alt="Art directed image">
</picture>
```

---

## 3. JavaScript Optimization

### Tree Shaking

Ensure your bundler removes unused code:

```typescript
// package.json - mark package as side-effect free
{
  "sideEffects": false
}

// Or specify files with side effects
{
  "sideEffects": ["*.css", "./src/polyfills.js"]
}
```

```typescript
// Enable tree shaking with named exports
// utils.ts
export function usedFunction() { }
export function unusedFunction() { }  // Will be removed

// consumer.ts
import { usedFunction } from './utils';  // Only usedFunction bundled
```

### Minification

Next.js minifies automatically. For custom setups:

```javascript
// webpack.config.js
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,  // Remove console.log
          },
        },
      }),
    ],
  },
};
```

### Script Loading

```html
<!-- Blocking (avoid) -->
<script src="/script.js"></script>

<!-- Async - downloads in parallel, executes when ready -->
<script src="/analytics.js" async></script>

<!-- Defer - downloads in parallel, executes after DOM -->
<script src="/app.js" defer></script>

<!-- Module - automatically deferred -->
<script type="module" src="/app.js"></script>
```

### Debouncing & Throttling

```typescript
// Debounce - wait until user stops
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle - limit execution frequency
function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Usage
const handleScroll = throttle(() => {
  // Expensive scroll handler
}, 100);

const handleSearch = debounce((query: string) => {
  // API call
}, 300);
```

---

## 4. CSS Optimization

### Critical CSS

Inline CSS needed for above-the-fold content:

```html
<head>
  <!-- Inline critical CSS -->
  <style>
    /* Only styles for above-fold content */
    .hero { ... }
    .nav { ... }
  </style>

  <!-- Load rest asynchronously -->
  <link rel="preload" href="/styles.css" as="style" onload="this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/styles.css"></noscript>
</head>
```

### Remove Unused CSS

```javascript
// postcss.config.js with PurgeCSS
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
      ],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: ['html', 'body'],
    }),
  ],
};
```

```javascript
// tailwind.config.js - built-in purging
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // Tailwind automatically purges unused classes in production
};
```

### Efficient Selectors

```css
/* Avoid: deeply nested selectors */
.header .nav .menu .item .link { }

/* Better: flat, specific selectors */
.nav-link { }

/* Avoid: universal selectors */
* { box-sizing: border-box; }

/* Better: inherit from root */
html { box-sizing: border-box; }
*, *::before, *::after { box-sizing: inherit; }

/* Avoid: attribute selectors on common elements */
[type="text"] { }

/* Better: class selector */
.text-input { }
```

### CSS Containment

```css
/* Tell browser this element is isolated */
.card {
  contain: layout style paint;
}

/* Full containment for known-size elements */
.sidebar {
  contain: strict;
  width: 300px;
  height: 100vh;
}

/* Content visibility for off-screen content */
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;  /* Estimated size */
}
```

---

## 5. Network Optimization

### Compression

```javascript
// next.config.js - compression enabled by default
module.exports = {
  compress: true,  // gzip compression
};
```

```nginx
# nginx.conf - enable Brotli and gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;

brotli on;
brotli_types text/plain text/css application/json application/javascript;
```

### Caching

```javascript
// next.config.js - cache static assets
module.exports = {
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};
```

### Resource Hints

```html
<head>
  <!-- Preconnect to critical origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://api.example.com">

  <!-- DNS prefetch for less critical origins -->
  <link rel="dns-prefetch" href="https://analytics.example.com">

  <!-- Preload critical resources -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/hero.webp" as="image">

  <!-- Prefetch next page -->
  <link rel="prefetch" href="/about">

  <!-- Prerender likely next page (Chrome only) -->
  <link rel="prerender" href="/dashboard">
</head>
```

### HTTP/2 & HTTP/3

- Enable HTTP/2 on your server/CDN
- Avoid domain sharding (counterproductive with HTTP/2)
- Use HTTP/3 (QUIC) where available

---

## 6. Rendering Optimization

### Avoid Layout Thrashing

```typescript
// Bad: forces multiple reflows
elements.forEach(el => {
  const height = el.offsetHeight;  // Read
  el.style.height = height + 10 + 'px';  // Write
});

// Good: batch reads, then batch writes
const heights = elements.map(el => el.offsetHeight);  // All reads
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px';  // All writes
});
```

### Use CSS Transforms

```css
/* Bad: triggers layout */
.animate {
  left: 100px;
  top: 100px;
}

/* Good: only compositing */
.animate {
  transform: translate(100px, 100px);
}

/* Promote to own layer for complex animations */
.complex-animation {
  will-change: transform;
  /* or */
  transform: translateZ(0);
}
```

### Virtual Lists

For long lists, only render visible items:

```typescript
// Using react-window
import { FixedSizeList } from 'react-window';

function VirtualList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

### React Optimization

```typescript
// Memoize expensive components
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  return <div>{/* expensive render */}</div>;
});

// Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Use transitions for non-urgent updates
import { useTransition } from 'react';

function Search() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);  // Urgent

    startTransition(() => {
      setResults(search(e.target.value));  // Can be interrupted
    });
  }

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results items={results} />}
    </>
  );
}
```

---

## Quick Wins Checklist

### Immediate Impact
- [ ] Enable compression (gzip/Brotli)
- [ ] Add caching headers
- [ ] Optimize/compress images
- [ ] Remove unused CSS/JS

### Medium Effort
- [ ] Implement code splitting
- [ ] Add resource hints (preconnect, preload)
- [ ] Lazy load below-fold images
- [ ] Use modern image formats (WebP/AVIF)

### Longer Term
- [ ] Implement critical CSS
- [ ] Virtual lists for long content
- [ ] Service worker for offline/caching
- [ ] Edge caching / CDN optimization

---

## Resources

- [web.dev Performance](https://web.dev/performance/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Next.js Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)

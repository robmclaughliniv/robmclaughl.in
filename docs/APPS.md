# Multi-App Architecture

> Guide for building and managing multiple apps on robmclaughl.in

## Overview

robmclaughl.in is designed to host multiple web applications ("apps") under a unified platform. This document covers:
- App architecture
- Creating new apps
- Shared components
- Routing strategy

---

## Platform Vision

```
robmclaughl.in (Platform)
├── /                    # Homepage - personal site
├── /vibe               # Vibe Generator - lofi music/visual app
├── /tools              # Developer tools collection
├── /art                # AI art playground
└── /music              # Standalone music player
```

---

## App Categories

### Current Apps

| App | Path | Status | Description |
|-----|------|--------|-------------|
| Homepage | `/` | Live | Personal landing page |
| Vibe Generator | `/vibe` | Planned | Lofi music + AI visuals |

### Planned Apps

| App | Path | Status | Description |
|-----|------|--------|-------------|
| Tools | `/tools` | Concept | Developer utilities |
| Art | `/art` | Concept | AI art generation |
| Music | `/music` | Concept | Standalone music player |
| Blog | `/blog` | Concept | Technical writing |

---

## Technical Architecture

### Directory Structure

```
app/
├── layout.tsx              # Root layout (all apps)
├── page.tsx                # Homepage (/)
├── globals.css             # Global styles
│
├── vibe/                   # Vibe Generator app
│   ├── layout.tsx          # Vibe-specific layout
│   ├── page.tsx            # Main page (/vibe)
│   └── components/         # Vibe-only components
│       ├── AudioPlayer.tsx
│       ├── ChannelSelector.tsx
│       └── VisualBackground.tsx
│
├── tools/                  # Tools app
│   ├── layout.tsx
│   ├── page.tsx            # Tools index (/tools)
│   └── [tool]/             # Individual tools
│       └── page.tsx        # /tools/json-formatter
│
├── art/                    # Art app
│   ├── layout.tsx
│   └── page.tsx
│
└── (shared)/               # Shared route group
    └── components/         # Shared across apps
        ├── AppNav.tsx
        ├── AppFooter.tsx
        └── AppCard.tsx
```

### Layout Hierarchy

```
RootLayout (app/layout.tsx)
├── Fonts, metadata, base styles
│
├── Homepage (app/page.tsx)
│   └── HeroBackground + content
│
├── VibeLayout (app/vibe/layout.tsx)
│   ├── Vibe-specific nav
│   └── VibePage (app/vibe/page.tsx)
│
└── ToolsLayout (app/tools/layout.tsx)
    ├── Tools sidebar
    └── ToolPage (app/tools/[tool]/page.tsx)
```

---

## Creating a New App

### Step 1: Create Directory Structure

```bash
# Create app directory
mkdir -p app/newapp/components

# Create main files
touch app/newapp/layout.tsx
touch app/newapp/page.tsx
```

### Step 2: Create Layout

```tsx
// app/newapp/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New App | robmclaughl.in',
  description: 'Description of your new app',
};

interface NewAppLayoutProps {
  children: React.ReactNode;
}

export default function NewAppLayout({ children }: NewAppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* App-specific header/nav can go here */}
      <main>{children}</main>
      {/* App-specific footer can go here */}
    </div>
  );
}
```

### Step 3: Create Main Page

```tsx
// app/newapp/page.tsx
'use client';

export default function NewAppPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-white">New App</h1>
      {/* App content */}
    </div>
  );
}
```

### Step 4: Register App (Optional)

Update app registry for homepage display:

```typescript
// lib/apps.ts
export const apps = [
  {
    id: 'vibe',
    name: 'Vibe Generator',
    description: 'Lofi music with AI visuals',
    path: '/vibe',
    icon: 'Music',
    status: 'live',
  },
  {
    id: 'newapp',
    name: 'New App',
    description: 'Your app description',
    path: '/newapp',
    icon: 'Star',
    status: 'beta',
  },
];
```

---

## Shared Components

### App Navigation

```tsx
// components/shared/AppNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AppNavProps {
  appName: string;
  backPath?: string;
}

export function AppNav({ appName, backPath = '/' }: AppNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={backPath}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ← Back
          </Link>
          <span className="text-white font-semibold">{appName}</span>
        </div>

        {/* App-specific nav items */}
      </div>
    </nav>
  );
}
```

### App Card (for Homepage)

```tsx
// components/shared/AppCard.tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface AppCardProps {
  name: string;
  description: string;
  path: string;
  icon: keyof typeof Icons;
  status: 'live' | 'beta' | 'coming-soon';
}

export function AppCard({ name, description, path, icon, status }: AppCardProps) {
  const Icon = Icons[icon];
  const isClickable = status !== 'coming-soon';

  const content = (
    <div className={cn(
      "p-6 rounded-lg border transition-all duration-300",
      "bg-zinc-900/50 border-zinc-800",
      isClickable && "hover:border-pink-500/50 hover:bg-zinc-900/80 cursor-pointer",
      !isClickable && "opacity-60 cursor-not-allowed"
    )}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-pink-500/10">
          <Icon className="w-6 h-6 text-pink-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            {status === 'beta' && (
              <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
                Beta
              </span>
            )}
            {status === 'coming-soon' && (
              <span className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-400 rounded">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-zinc-400 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );

  if (!isClickable) return content;

  return <Link href={path}>{content}</Link>;
}
```

---

## Routing Strategy

### Path-Based Routing (Current Approach)

All apps live under the main domain:

```
robmclaughl.in/         → Homepage
robmclaughl.in/vibe     → Vibe Generator
robmclaughl.in/tools    → Tools
robmclaughl.in/art      → Art
```

**Pros:**
- Single deployment
- Shared authentication (future)
- Simpler infrastructure
- Better SEO (single domain)

**Cons:**
- All apps in single codebase
- Larger bundle if not code-split

### Subdomain Routing (Alternative)

Apps on separate subdomains:

```
robmclaughl.in          → Homepage
vibe.robmclaughl.in     → Vibe Generator
tools.robmclaughl.in    → Tools
```

**Pros:**
- Complete isolation
- Independent deployment
- Clear separation

**Cons:**
- More complex infrastructure
- SSL for each subdomain
- Cross-domain considerations

**Decision:** Start with path-based routing for simplicity.

---

## App Configuration

### App Registry

Central configuration for all apps:

```typescript
// lib/apps.ts
export interface App {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  status: 'live' | 'beta' | 'coming-soon' | 'hidden';
  features?: string[];
  color?: string;
}

export const apps: App[] = [
  {
    id: 'vibe',
    name: 'Vibe Generator',
    description: 'Lofi music with AI-generated visuals',
    path: '/vibe',
    icon: 'Music',
    status: 'beta',
    features: ['audio', 'visuals', 'ai'],
    color: 'pink',
  },
  {
    id: 'tools',
    name: 'Developer Tools',
    description: 'Useful utilities for developers',
    path: '/tools',
    icon: 'Wrench',
    status: 'coming-soon',
    features: ['converters', 'formatters'],
    color: 'cyan',
  },
];

export function getApp(id: string): App | undefined {
  return apps.find(app => app.id === id);
}

export function getVisibleApps(): App[] {
  return apps.filter(app => app.status !== 'hidden');
}
```

### Per-App Configuration

```typescript
// app/vibe/config.ts
export const vibeConfig = {
  name: 'Vibe Generator',
  defaultChannel: 'chill',
  channels: [
    { id: 'chill', name: 'Chill Vibes', color: '#ec4899' },
    { id: 'focus', name: 'Deep Focus', color: '#22d3ee' },
    { id: 'ambient', name: 'Late Night', color: '#a855f7' },
  ],
  features: {
    aiGeneration: true,
    sharing: false,  // Coming later
    favorites: false,
  },
};
```

---

## Styling Across Apps

### Shared Base Styles

All apps share:
- CRT effects (`globals.css`)
- Color palette (Tailwind config)
- Typography (font families)
- Basic components (shadcn/ui)

### App-Specific Themes

Apps can override colors:

```tsx
// app/vibe/layout.tsx
export default function VibeLayout({ children }) {
  return (
    <div className="vibe-theme">
      {children}
    </div>
  );
}
```

```css
/* app/vibe/styles.css */
.vibe-theme {
  --accent: theme('colors.pink.500');
  --accent-foreground: theme('colors.pink.100');
}

/* Or via Tailwind */
.vibe-theme {
  @apply [--accent:theme(colors.pink.500)];
}
```

---

## Data Sharing Between Apps

### Shared State (Future)

For features like authentication:

```typescript
// contexts/UserContext.tsx
'use client';

import { createContext, useContext } from 'react';

interface User {
  id: string;
  name: string;
  preferences: Record<string, unknown>;
}

const UserContext = createContext<User | null>(null);

export function useUser() {
  return useContext(UserContext);
}
```

### Local Storage Namespacing

Keep app data separate:

```typescript
// lib/storage.ts
export function getAppStorage(appId: string) {
  return {
    get: (key: string) => {
      const value = localStorage.getItem(`${appId}:${key}`);
      return value ? JSON.parse(value) : null;
    },
    set: (key: string, value: unknown) => {
      localStorage.setItem(`${appId}:${key}`, JSON.stringify(value));
    },
    remove: (key: string) => {
      localStorage.removeItem(`${appId}:${key}`);
    },
  };
}

// Usage
const vibeStorage = getAppStorage('vibe');
vibeStorage.set('volume', 75);
vibeStorage.get('volume'); // 75
```

---

## Deployment Considerations

### Static Export

All apps build to static HTML:

```
out/
├── index.html          # Homepage
├── vibe/
│   └── index.html      # Vibe Generator
├── tools/
│   ├── index.html      # Tools index
│   └── json-formatter/
│       └── index.html  # Individual tool
└── _next/              # Shared assets
```

### Code Splitting

Next.js automatically code-splits by route:
- `/vibe` only loads vibe components
- `/tools` only loads tools components

### API Routes

Since using static export, API routes go through Lambda:

```
Frontend (S3/CloudFront)     Backend (Lambda)
        │                           │
        ├── /vibe ───────────────► /api/vibe/*
        ├── /tools ──────────────► /api/tools/*
        └── /art ────────────────► /api/art/*
```

---

## Adding Apps Checklist

When adding a new app:

- [ ] Create `app/[appname]/` directory
- [ ] Add `layout.tsx` with metadata
- [ ] Add `page.tsx` main component
- [ ] Create app-specific components in `components/`
- [ ] Add to app registry in `lib/apps.ts`
- [ ] Update homepage to show new app
- [ ] Add navigation back to homepage
- [ ] Match CRT aesthetic
- [ ] Test mobile responsiveness
- [ ] Update documentation

---

## Related Documents

- [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) - App features
- [VIBE_GENERATOR.md](./VIBE_GENERATOR.md) - Flagship app spec
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guide

---

*Last updated: January 2026*

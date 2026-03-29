# /new-app Command

> Scaffold a new sub-application

## Purpose

Create the directory structure and boilerplate files for a new app in the robmclaughl.in platform.

## Usage

```
/new-app <app-name> [--description "App description"]
```

## Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| app-name | URL-safe name (lowercase, hyphens) | Yes |
| --description | Short description for metadata | Optional |

## Generated Structure

```
app/<app-name>/
├── layout.tsx          # App layout with metadata
├── page.tsx            # Main page component
├── components/         # App-specific components
│   └── .gitkeep
└── config.ts           # App configuration
```

## Template Files

### layout.tsx

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '<AppName> | robmclaughl.in',
  description: '<description>',
};

interface <AppName>LayoutProps {
  children: React.ReactNode;
}

export default function <AppName>Layout({ children }: <AppName>LayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
```

### page.tsx

```tsx
'use client';

import { AppNav } from '@/components/shared/AppNav';

export default function <AppName>Page() {
  return (
    <>
      <AppNav appName="<App Name>" />
      <div className="container mx-auto px-4 pt-20 pb-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          <App Name>
        </h1>
        {/* App content */}
      </div>
    </>
  );
}
```

### config.ts

```typescript
export const <appName>Config = {
  name: '<App Name>',
  description: '<description>',
  features: {
    // Feature flags
  },
};
```

## Post-Scaffold Steps

After running this command:

1. **Add to app registry**
   ```typescript
   // lib/apps.ts
   {
     id: '<app-name>',
     name: '<App Name>',
     description: '<description>',
     path: '/<app-name>',
     icon: 'Star',
     status: 'beta',
   }
   ```

2. **Create shared navigation** (if not exists)
   - `components/shared/AppNav.tsx`

3. **Test locally**
   ```bash
   npm run dev
   # Visit http://localhost:3000/<app-name>
   ```

4. **Update documentation**
   - Add to `docs/APPS.md`
   - Add to `docs/FEATURE_BACKLOG.md` if features planned

## Example

```
/new-app tools --description "Developer utilities"
```

Creates:
- `app/tools/layout.tsx`
- `app/tools/page.tsx`
- `app/tools/components/.gitkeep`
- `app/tools/config.ts`

## Notes

- App names should be lowercase with hyphens
- Follow existing CRT aesthetic in templates
- Include proper TypeScript types
- Make components client-side by default for interactivity

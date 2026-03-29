# Claude Code Agent Guide for robmclaughl.in

> **Master Documentation for AI Agents Working on This Codebase**

## Quick Reference

| Item | Value |
|------|-------|
| **Live Site** | https://robmclaughl.in |
| **Repository** | robmclaughliniv/robmclaughl.in |
| **Framework** | Next.js 15.1.0 (App Router, Static Export) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Backend** | AWS Lambda + DynamoDB + API Gateway |
| **Infrastructure** | Terraform with S3 backend |

---

## 1. Essential Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run build        # Build static export to /out
npm run lint         # Run ESLint (may have errors - see TECHNICAL_DEBT.md)

# Testing (planned - not yet implemented)
npm test             # Run unit tests (TO BE ADDED)
npm run e2e          # Run E2E tests (TO BE ADDED)

# Infrastructure (from terraform/ directory)
terraform init       # Initialize Terraform
terraform plan       # Preview changes
terraform apply      # Apply changes
```

---

## 2. Code Patterns (MUST FOLLOW)

### 2.1 Client Components
```tsx
'use client';  // MUST be first line for interactive components

import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export function ComponentName({ className, children }: ComponentProps) {
  return (
    <div className={cn("base-classes", className)}>
      {children}
    </div>
  );
}
```

### 2.2 Import Order (Always follow)
```tsx
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { SomeIcon } from 'lucide-react';

// 2. Internal components
import { Button } from '@/components/ui/button';
import { HeroBackground } from '@/components/HeroBackground';

// 3. Types and utilities
import type { SomeType } from '@/types';
import { cn } from '@/lib/utils';
```

### 2.3 Props Definition
```tsx
// Always use interfaces (not types) for component props
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';  // Optional with ?
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;  // Required props - no ?
}
```

### 2.4 Tailwind + cn() Utility
```tsx
import { cn } from '@/lib/utils';

// Use cn() for conditional class merging
<div className={cn(
  "base-class always-applied",
  isActive && "active-state-class",
  className  // Allow parent override
)} />
```

### 2.5 Custom Hooks Location
```tsx
// ALL hooks go in /hooks directory with 'use' prefix
// File: hooks/use-audio-player.ts
import { useState, useEffect } from 'react';

export function useAudioPlayer() {
  // Hook implementation
}
```

### 2.6 Named Exports (Not Default)
```tsx
// CORRECT - Named export
export function MyComponent() { }
export { MyComponent };

// WRONG - Default export (don't use)
export default function MyComponent() { }
```

---

## 3. Architecture Overview

```
robmclaughl.in/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page (/)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles + CRT effects
├── components/
│   ├── ui/                # shadcn/ui components (50+)
│   ├── HeroBackground.tsx # Video + CRT overlay component
│   └── waveform.tsx       # SVG waveform decoration
├── hooks/                 # Custom React hooks
├── lib/
│   └── utils.ts          # cn() utility and helpers
├── lambda_src/           # AWS Lambda source code
│   └── src/index.ts      # Lambda handler
├── terraform/            # Infrastructure as Code
│   ├── main.tf           # Main config
│   └── modules/          # Reusable TF modules
├── public/               # Static assets
│   └── videos/           # Background videos
├── docs/                 # Project documentation
├── .claude/              # Agent documentation (YOU ARE HERE)
│   ├── CLAUDE.md         # This file
│   ├── commands/         # Slash command definitions
│   └── subagents/        # Specialized agent prompts
└── memory-bank/          # Cursor IDE context (legacy)
```

---

## 4. Key Files Reference

| File | Purpose | When to Reference |
|------|---------|-------------------|
| `app/page.tsx` | Main page implementation | Creating new pages |
| `components/HeroBackground.tsx` | Complex client component | Video, effects, viewport |
| `components/ui/button.tsx` | shadcn/ui pattern | Adding UI components |
| `lambda_src/src/index.ts` | Lambda handler pattern | API development |
| `terraform/main.tf` | Infrastructure patterns | Infrastructure changes |
| `tailwind.config.ts` | Theme configuration | Styling, colors |
| `components.json` | shadcn/ui config | Adding shadcn components |

---

## 5. Current Site Features

### 5.1 Lo-Fi/CRT Aesthetic
- **CRT scanline effect** - CSS in `globals.css`
- **Neon glow effects** - Pink/cyan shadows on text and icons
- **Video background** - Auto-playing muted video with overlay
- **Pixel font** - Press Start 2P for headers
- **Flicker animations** - `.text-flicker`, `.box-flicker` classes

### 5.2 Existing Components
- `HeroBackground` - Full-screen video with CRT overlay
- `Waveform` - Decorative SVG waveform
- All shadcn/ui components in `components/ui/`

---

## 6. AWS Infrastructure

| Service | Purpose | Configuration |
|---------|---------|---------------|
| S3 | Static hosting | `robmclaughl-in-website-bucket` |
| CloudFront | CDN + HTTPS | With WAF protection |
| Route53 | DNS | Zone: `Z2PPIVE6CKK74T` |
| ACM | SSL Certificate | Auto-renewed |
| Lambda | Backend API | Node.js 20.x runtime |
| DynamoDB | Database | On-demand capacity |
| API Gateway | HTTP API | v2 with Lambda proxy |
| WAF | Security | AWS managed rules |

---

## 7. Deployment Flow

1. **Push to `master`** triggers GitHub Actions
2. **Build step**: `npm run build` creates `/out` static export
3. **S3 sync**: Static files uploaded to S3 bucket
4. **CloudFront invalidation**: CDN cache cleared
5. **Terraform apply**: Infrastructure changes (if any)

---

## 8. Documentation Index

### Core Documents (in `docs/`)
| Document | Purpose |
|----------|---------|
| `ARCHITECTURE.md` | System design and patterns |
| `TECHNICAL_DEBT.md` | Known issues to fix |
| `FEATURE_BACKLOG.md` | Planned features by priority |
| `AGENT_QUEUE.md` | Ready-to-work tasks |
| `TODO.md` | Project roadmap |
| `IMPROVEMENT_PROPOSALS.md` | Ideas for consideration |

### Specifications (in `docs/`)
| Document | Purpose |
|----------|---------|
| `VIBE_GENERATOR.md` | Flagship app specification |
| `API_INTEGRATION.md` | External API documentation |
| `SECURITY.md` | Security requirements |
| `RESEARCH.md` | API research notes |

### Operations (in `docs/`)
| Document | Purpose |
|----------|---------|
| `DEPLOYMENT.md` | Deployment procedures |
| `CONTRIBUTING.md` | Contribution guidelines |
| `APPS.md` | Multi-app architecture |

---

## 9. Agent Commands

Available slash commands in `.claude/commands/`:

| Command | Purpose |
|---------|---------|
| `/ship` | Build, test, and deploy |
| `/commit-push-pr` | Create commit, push, and PR |
| `/test-apis` | Test external API integrations |
| `/new-app` | Scaffold a new sub-app |
| `/add-feature` | Add feature to backlog |
| `/add-tech-debt` | Document technical debt |
| `/claim-task` | Claim a task from queue |
| `/complete-task` | Mark task as completed |

---

## 10. Specialized Subagents

Available subagents in `.claude/subagents/`:

| Subagent | Specialty |
|----------|-----------|
| `api-integration-specialist` | External API integration |
| `security-auditor` | Security review and fixes |
| `architecture-preserver` | Maintain code patterns |
| `tester` | Write and run tests |
| `code-simplifier` | Reduce complexity |

---

## 11. Critical Rules

1. **NO modifications to working code** without understanding it first
2. **Read before edit** - Always read files before modifying
3. **Preserve CRT aesthetic** - All new UI must match lo-fi style
4. **Use existing components** - Check `components/ui/` before creating new
5. **Follow import order** - External > Internal > Types
6. **Named exports only** - No default exports
7. **TypeScript interfaces** - For props, not type aliases
8. **Test before PR** - `npm run build` must succeed

---

## 12. Getting Started Checklist

When starting work on this codebase:

- [ ] Read this document completely
- [ ] Review `docs/ARCHITECTURE.md` for system overview
- [ ] Check `docs/AGENT_QUEUE.md` for available tasks
- [ ] Check `docs/TECHNICAL_DEBT.md` before making changes
- [ ] Run `npm run dev` to verify environment works
- [ ] Review `app/page.tsx` to understand current patterns

---

## 13. Contact & Resources

- **Live Site**: https://robmclaughl.in
- **GitHub**: https://github.com/robmclaughliniv/robmclaughl.in
- **Root README**: `README.md` (setup instructions)
- **Local Dev**: `LOCAL_DEVELOPMENT.md` (LocalStack setup)

---

*Last updated: January 2026*

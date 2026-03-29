# Contributing Guide

> Guidelines for contributing to robmclaughl.in

## Overview

This document covers:
- Development workflow
- Code standards
- Pull request process
- Agent contribution guidelines

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/robmclaughliniv/robmclaughl.in.git
cd robmclaughl.in

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Open in browser
open http://localhost:3000
```

---

## Development Workflow

### Branch Strategy

```
master (production)
  │
  ├── feature/TASK-001-audio-player
  ├── feature/TASK-002-dalle-api
  ├── fix/bug-description
  └── chore/cleanup-description
```

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/TASK-XXX-description` | `feature/TASK-001-audio-player` |
| Bug Fix | `fix/description` | `fix/video-autoplay-mobile` |
| Chore | `chore/description` | `chore/update-dependencies` |
| Docs | `docs/description` | `docs/update-readme` |

### Workflow Steps

1. **Create branch from master**
   ```bash
   git checkout master
   git pull origin master
   git checkout -b feature/TASK-XXX-description
   ```

2. **Make changes**
   - Follow code standards (below)
   - Write/update tests (when applicable)
   - Update documentation if needed

3. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add audio player component

   - Implement play/pause functionality
   - Add volume control slider
   - Include keyboard accessibility

   Refs: TASK-001"
   ```

4. **Push and create PR**
   ```bash
   git push -u origin feature/TASK-XXX-description
   # Create PR via GitHub
   ```

---

## Commit Messages

### Format

```
<type>: <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code restructuring |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```bash
# Feature
git commit -m "feat: add channel selector component

Implement channel switching for vibe generator with:
- Dropdown selector for mobile
- Tab interface for desktop
- Keyboard navigation support

Refs: TASK-005"

# Bug fix
git commit -m "fix: resolve video autoplay on iOS

Safari requires user gesture for autoplay.
Added click-to-play overlay for mobile devices.

Fixes: #42"

# Chore
git commit -m "chore: update dependencies

- Next.js 15.1.1
- React 18.2.1
- Various security patches"
```

---

## Code Standards

### TypeScript

```typescript
// Use strict typing
// ✅ Good
function getUser(id: string): Promise<User> { }

// ❌ Bad
function getUser(id: any): any { }
```

### Components

```tsx
// Use functional components with named exports
// ✅ Good
export function MyComponent({ prop }: MyComponentProps) { }

// ❌ Bad
export default function MyComponent({ prop }) { }
```

### Props Interfaces

```typescript
// Use interfaces for props
// ✅ Good
interface ButtonProps {
  variant?: 'default' | 'outline';
  onClick: () => void;
}

// ❌ Bad
type ButtonProps = { ... }
```

### Imports

```typescript
// Follow import order: external → internal → types
// ✅ Good
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

// ❌ Bad (mixed order)
import type { User } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
```

### Styling

```tsx
// Use Tailwind with cn() utility
// ✅ Good
<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)} />

// ❌ Bad (inline styles)
<div style={{ backgroundColor: isActive ? 'red' : 'blue' }} />
```

---

## Pull Request Process

### Before Creating PR

- [ ] Code follows style guidelines
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (or errors documented)
- [ ] Tests pass (when applicable)
- [ ] Documentation updated if needed
- [ ] Commits are clean and descriptive

### PR Title Format

```
<type>: <description> [TASK-XXX]
```

Examples:
- `feat: add audio player component [TASK-001]`
- `fix: resolve mobile video autoplay`
- `docs: update deployment guide`

### PR Description Template

```markdown
## Summary
Brief description of changes.

## Changes
- Change 1
- Change 2
- Change 3

## Testing
How to test these changes:
1. Step 1
2. Step 2

## Screenshots
(if UI changes)

## Related
- TASK-XXX
- Closes #XX
```

### Review Checklist

Reviewers should verify:
- [ ] Code follows project patterns
- [ ] No security vulnerabilities introduced
- [ ] Changes are scoped appropriately
- [ ] Tests adequate for changes
- [ ] Documentation updated

---

## Agent Contribution Guidelines

When working as a Claude Code agent:

### Before Starting

1. Read `.claude/CLAUDE.md` completely
2. Review `docs/ARCHITECTURE.md`
3. Check `docs/AGENT_QUEUE.md` for available tasks
4. Review `docs/TECHNICAL_DEBT.md` for known issues

### During Development

1. **Always read before modifying**
   - Never edit a file you haven't read
   - Understand existing patterns first

2. **Follow existing conventions**
   - Match code style of surrounding code
   - Use existing components when possible
   - Follow import order rules

3. **Test changes locally**
   - Run `npm run dev` to test
   - Verify `npm run build` succeeds
   - Check for console errors

4. **Document significant decisions**
   - Add comments for complex logic
   - Update docs if patterns change

### Claiming Tasks

1. Check `docs/AGENT_QUEUE.md` for ready tasks
2. Update task status to "In Progress"
3. Create feature branch
4. Reference task ID in commits

### Completing Tasks

1. Verify all acceptance criteria met
2. Run build and verify no errors
3. Update task status to "Review"
4. Create PR with task reference
5. After merge, update status to "Completed"

---

## File Locations

### Where to Put Things

| Type | Location |
|------|----------|
| Pages/Routes | `app/` |
| UI Components | `components/ui/` (shadcn) |
| Custom Components | `components/` |
| Hooks | `hooks/` |
| Utilities | `lib/` |
| Types | `types/` or inline |
| Static Assets | `public/` |
| Lambda Code | `lambda_src/src/` |
| Infrastructure | `terraform/` |
| Documentation | `docs/` |

### Files to Not Modify

Unless specifically needed:
- `components/ui/*` - shadcn components
- `tailwind.config.ts` - Unless adding themes
- `terraform/modules/*` - Reusable modules
- `package-lock.json` - Auto-generated

---

## Testing Guidelines

### When Tests Exist

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.ts

# Run with coverage
npm test -- --coverage
```

### Writing Tests

```typescript
// tests/components/AudioPlayer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioPlayer } from '@/components/AudioPlayer';

describe('AudioPlayer', () => {
  it('renders play button initially', () => {
    render(<AudioPlayer src="/test.mp3" />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('toggles to pause when clicked', async () => {
    render(<AudioPlayer src="/test.mp3" />);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});
```

---

## Documentation Standards

### When to Update Docs

- Adding new features → Update FEATURE_BACKLOG.md status
- Completing tasks → Update AGENT_QUEUE.md
- Finding bugs → Add to TECHNICAL_DEBT.md
- Changing architecture → Update ARCHITECTURE.md
- Adding APIs → Update API_INTEGRATION.md

### Documentation Style

- Use clear, concise language
- Include code examples where helpful
- Keep tables for structured data
- Use diagrams for complex flows
- Update "Last updated" date

---

## Getting Help

### Questions About Code

1. Check existing documentation
2. Search codebase for similar patterns
3. Review git history for context

### Reporting Issues

Create an issue on GitHub with:
- Clear description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

### Suggesting Improvements

Add to `docs/IMPROVEMENT_PROPOSALS.md` with:
- Problem description
- Proposed solution
- Benefits and trade-offs

---

## Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [AGENT_QUEUE.md](./AGENT_QUEUE.md) - Available tasks
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment process
- [.claude/CLAUDE.md](../.claude/CLAUDE.md) - Agent guide

---

*Last updated: January 2026*

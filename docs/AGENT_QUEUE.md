# Agent Task Queue

> Ready-to-implement tasks for Claude Code agents

## Quick Stats

| Status | Count |
|--------|-------|
| Ready | 5 |
| In Progress | 0 |
| Blocked | 0 |
| Completed | 0 |

---

## Ready to Work

These tasks have clear requirements and can be started immediately.

---

### TASK-001: Create AudioPlayer Component

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-001 |
| **Type** | Feature |
| **Priority** | P0 |
| **Status** | Ready |
| **Feature Ref** | VG-001 |

**Summary:**
Build the core audio player component for the Vibe Generator app.

**Acceptance Criteria:**
- [ ] Component file: `components/AudioPlayer.tsx`
- [ ] Play/pause button with toggle state
- [ ] Volume slider (0-100%)
- [ ] Mute button
- [ ] Visual audio indicator (simple waveform or bars)
- [ ] Props interface for audio URL source
- [ ] Keyboard accessibility (Tab, Space, Enter)
- [ ] ARIA labels for screen readers
- [ ] Matches CRT aesthetic (pink glow, pixel style)
- [ ] Responsive design (mobile-friendly)
- [ ] localStorage persistence for volume setting

**Technical Guidance:**
```tsx
// Suggested structure
interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export function AudioPlayer({ src, autoPlay, className, onPlay, onPause }: AudioPlayerProps) {
  // Use useRef for audio element
  // Use useState for playing, volume, muted states
  // Use useEffect for localStorage persistence
}
```

**Files to Create:**
- `components/AudioPlayer.tsx`
- `hooks/use-audio.ts` (optional, for reusable audio logic)

**Files to Reference:**
- `components/HeroBackground.tsx` - Pattern for media handling
- `components/ui/slider.tsx` - Volume slider base
- `components/ui/button.tsx` - Play/pause buttons
- `app/globals.css` - CRT styling classes

**Dependencies:** None

**Testing Notes:**
- Test with actual lofi stream URLs
- Test autoplay restrictions in Chrome
- Test keyboard navigation
- Test on mobile browsers

---

### TASK-002: Add DALL-E API Route

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-002 |
| **Type** | Feature |
| **Priority** | P1 |
| **Status** | Ready |
| **Feature Ref** | VG-005 |

**Summary:**
Create Lambda endpoint for DALL-E image generation.

**Acceptance Criteria:**
- [ ] Lambda handler for POST `/generate-image`
- [ ] Request validation (prompt, style)
- [ ] OpenAI API integration
- [ ] Error handling with appropriate status codes
- [ ] Response includes image URL
- [ ] Basic rate limiting (IP-based)
- [ ] Cost logging to DynamoDB

**Technical Guidance:**
```typescript
// Request body
interface GenerateImageRequest {
  prompt: string;
  style: 'lofi' | 'chill' | 'ambient' | 'focus';
  size?: '1024x1024' | '1792x1024';
}

// Response body
interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  requestId: string;
}
```

**Files to Create:**
- `lambda_src/src/handlers/generate-image.ts`
- Update `lambda_src/src/index.ts` for routing

**Files to Reference:**
- `lambda_src/src/index.ts` - Existing handler pattern
- `docs/API_INTEGRATION.md` - OpenAI integration details
- `docs/SECURITY.md` - API key handling

**Environment Variables Needed:**
- `OPENAI_API_KEY` - OpenAI API key
- `GENERATIONS_TABLE_NAME` - DynamoDB table for logging

**Dependencies:**
- OpenAI account with API access
- Terraform updates for new Lambda config

**Security Considerations:**
- Never expose API key to frontend
- Validate and sanitize prompts
- Implement rate limiting before production

---

### TASK-003: Fix ESLint/TypeScript Errors

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-003 |
| **Type** | Tech Debt |
| **Priority** | High |
| **Status** | Ready |
| **Debt Ref** | TD-001 |

**Summary:**
Enable and fix ESLint/TypeScript errors to restore build-time quality checks.

**Acceptance Criteria:**
- [ ] Run `npm run lint` and document all errors
- [ ] Fix each error systematically
- [ ] Remove `ignoreDuringBuilds: true` from next.config.mjs
- [ ] Remove `ignoreBuildErrors: true` from next.config.mjs
- [ ] Verify `npm run build` passes cleanly
- [ ] Verify `npm run lint` passes

**Approach:**
1. First, run lint and capture output:
   ```bash
   npm run lint > lint-errors.txt 2>&1
   ```
2. Categorize errors by type
3. Fix in order: TypeScript errors first, then ESLint
4. Common fixes:
   - Add missing types
   - Fix unused variables (prefix with `_` or remove)
   - Add `'use client'` where needed
5. After all fixes, update next.config.mjs:
   ```javascript
   const nextConfig = {
     // Remove these two blocks entirely
     // eslint: { ignoreDuringBuilds: true },
     // typescript: { ignoreBuildErrors: true },
     // ...rest of config
   }
   ```
6. Run build to verify

**Files to Modify:**
- `next.config.mjs` - Remove ignore flags
- Various component files (based on lint output)

**Files to Reference:**
- `CLAUDE.md` - Code style guidelines
- `.eslintrc.json` (if exists) - Lint rules

**Dependencies:** None

**Notes:**
- This may reveal issues in multiple files
- Create separate commits for each file/category if large

---

### TASK-004: Remove Duplicate Hooks

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-004 |
| **Type** | Tech Debt |
| **Priority** | High |
| **Status** | Ready |
| **Debt Ref** | TD-003, TD-004 |

**Summary:**
Remove duplicate hook files from `components/ui/` directory.

**Acceptance Criteria:**
- [ ] Verify `hooks/use-toast.ts` and `components/ui/use-toast.ts` are identical
- [ ] Verify `hooks/use-mobile.tsx` and `components/ui/use-mobile.tsx` are identical
- [ ] Update all imports to use `@/hooks/` path
- [ ] Delete `components/ui/use-toast.ts`
- [ ] Delete `components/ui/use-mobile.tsx`
- [ ] Verify build succeeds

**Approach:**
1. Diff the files:
   ```bash
   diff hooks/use-toast.ts components/ui/use-toast.ts
   diff hooks/use-mobile.tsx components/ui/use-mobile.tsx
   ```
2. Search for imports:
   ```bash
   grep -r "components/ui/use-toast" .
   grep -r "components/ui/use-mobile" .
   ```
3. Update any imports found
4. Delete duplicate files
5. Build and verify

**Files to Modify:**
- Any file importing from `@/components/ui/use-toast`
- Any file importing from `@/components/ui/use-mobile`

**Files to Delete:**
- `components/ui/use-toast.ts`
- `components/ui/use-mobile.tsx`

**Dependencies:** None

**Notes:**
- Quick win, low risk
- Can be combined with other cleanup tasks

---

### TASK-005: Create ChannelSelector Component

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-005 |
| **Type** | Feature |
| **Priority** | P0 |
| **Status** | Ready |
| **Feature Ref** | VG-002 |

**Summary:**
Build channel/station selector for the Vibe Generator.

**Acceptance Criteria:**
- [ ] Component file: `components/ChannelSelector.tsx`
- [ ] Display 3+ channels with name and description
- [ ] Visual indicator for active channel
- [ ] Click/tap to change channel
- [ ] Keyboard navigation (arrow keys)
- [ ] Callback prop for channel change
- [ ] CRT aesthetic styling
- [ ] Responsive (dropdown on mobile, tabs on desktop)

**Technical Guidance:**
```tsx
interface Channel {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  mood: 'chill' | 'focus' | 'ambient';
}

interface ChannelSelectorProps {
  channels: Channel[];
  activeChannelId: string;
  onChannelChange: (channel: Channel) => void;
  className?: string;
}

// Initial channels data
const DEFAULT_CHANNELS: Channel[] = [
  {
    id: 'chill',
    name: 'Chill Vibes',
    description: 'Relaxing lofi beats',
    streamUrl: 'https://example.com/chill-stream',
    mood: 'chill',
  },
  // ... more channels
];
```

**Files to Create:**
- `components/ChannelSelector.tsx`
- `lib/channels.ts` (channel data)

**Files to Reference:**
- `components/ui/tabs.tsx` - Tab pattern
- `components/ui/select.tsx` - Dropdown pattern
- `app/globals.css` - CRT styling

**Dependencies:** TASK-001 (AudioPlayer) - for integration

**Notes:**
- Can be developed in parallel with AudioPlayer
- Stream URLs will need to be sourced (placeholder URLs okay initially)

---

## Task Status Definitions

| Status | Meaning |
|--------|---------|
| **Ready** | All requirements clear, can start immediately |
| **In Progress** | Currently being worked on |
| **Blocked** | Waiting on dependency or clarification |
| **Review** | PR submitted, awaiting review |
| **Completed** | Merged to main branch |

---

## Claiming a Task

When starting work on a task:

1. Update the task status to "In Progress"
2. Add your identifier (agent session, user name)
3. Create a working branch: `feature/TASK-XXX-description`
4. Reference the task ID in commits

Example:
```markdown
| **Status** | In Progress |
| **Assignee** | Agent-Session-123 |
| **Branch** | feature/TASK-001-audio-player |
```

---

## Completing a Task

When finishing a task:

1. Ensure all acceptance criteria are checked
2. Run `npm run build` to verify
3. Create PR with task ID in title
4. Update status to "Review"
5. After merge, update status to "Completed"
6. Add completion date

---

## Adding New Tasks

When adding a task to the queue:

1. Use next available ID (TASK-XXX)
2. Fill out all fields completely
3. Ensure clear acceptance criteria
4. Link to feature/debt reference
5. List all file paths affected
6. Note any dependencies
7. Update Quick Stats count

---

## Completed Tasks Archive

(Move completed tasks here with completion date)

| Task ID | Title | Completed | PR |
|---------|-------|-----------|-----|
| - | - | - | - |

---

*Last updated: January 2026*

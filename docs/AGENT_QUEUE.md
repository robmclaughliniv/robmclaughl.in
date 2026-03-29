# Agent Task Queue

> Ready-to-implement tasks for Claude Code agents

## Quick Stats

| Status | Count |
|--------|-------|
| Ready | 11 |
| In Progress | 0 |
| Blocked | 0 |
| Superseded | 1 |
| Completed | 0 |

---

## Ready to Work

These tasks have clear requirements and can be started immediately.

---

### TASK-003: Fix ESLint/TypeScript Errors

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-003 |
| **Type** | Tech Debt |
| **Priority** | P0 |
| **Status** | Ready |
| **Debt Ref** | TD-001 |
| **Phase** | 1 — Foundation & Cleanup |

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
| **Priority** | P0 |
| **Status** | Ready |
| **Debt Ref** | TD-003, TD-004 |
| **Phase** | 1 — Foundation & Cleanup |

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
| **Priority** | P1 |
| **Status** | Ready |
| **Feature Ref** | VG-002 |
| **Phase** | 2 — Vibe Generator MVP, Milestone 2 |

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

const DEFAULT_CHANNELS: Channel[] = [
  {
    id: 'chill',
    name: 'Chill Vibes',
    description: 'Relaxing lofi beats',
    streamUrl: 'https://example.com/chill-stream',
    mood: 'chill',
  },
];
```

**Files to Create:**
- `components/ChannelSelector.tsx`
- `lib/channels.ts` (channel data)

**Files to Reference:**
- `components/ui/tabs.tsx` - Tab pattern
- `components/ui/select.tsx` - Dropdown pattern
- `app/globals.css` - CRT styling

**Dependencies:** TASK-007 (AudioPlayer core) - for integration

**Notes:**
- Part of Phase 2 Milestone 2 — not needed for audio player MVP
- Stream URLs will need to be sourced (placeholder URLs okay initially)

---

### TASK-006: Audio Infrastructure — S3 Hosting & Playlist Manifest

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-006 |
| **Type** | Infrastructure |
| **Priority** | P0 |
| **Status** | Ready |
| **Feature Ref** | VG-001 |
| **Phase** | 2 — Vibe Generator MVP, Milestone 1 (Audio Player) |

**Summary:**
Set up S3/CloudFront hosting for audio files and a playlist JSON manifest that the player component will fetch at runtime.

**Acceptance Criteria:**
- [ ] `/audio/` prefix exists in the existing S3 bucket for hosting `.mp3` files
- [ ] `playlist.json` at `/audio/playlist.json` matches the schema below
- [ ] CloudFront serves `.mp3` files with correct `Content-Type: audio/mpeg` header
- [ ] CORS headers allow the site origin to fetch JSON and stream audio
- [ ] 4–6 tracks (real Suno-generated or placeholder) uploaded for testing
- [ ] `https://robmclaughl.in/audio/playlist.json` returns valid JSON
- [ ] `https://robmclaughl.in/audio/<track>.mp3` streams audio in browser
- [ ] Adding a new track = upload `.mp3` to S3 + update `playlist.json` — no site redeploy needed
- [ ] Local dev: copy of `playlist.json` and a test track in `public/audio/` so the player works locally without hitting prod S3

**Playlist Schema:**
```json
{
  "tracks": [
    {
      "id": "track-01",
      "title": "Track Title",
      "src": "/audio/track-01.mp3"
    }
  ]
}
```

`src` paths should be relative to the CloudFront domain so they work in both dev and prod.

**Files to Create/Modify:**
- `public/audio/playlist.json` — local dev copy
- `public/audio/` — placeholder `.mp3` for local dev
- S3 bucket: `/audio/` prefix with real files

**Files to Reference:**
- Terraform S3/CloudFront config: `terraform/modules/s3/`, `terraform/modules/cloudfront/`
- Deploy workflow: `.github/workflows/`

**Dependencies:** None — can start immediately.

**Notes:**
- Audio files are managed separately from the site deploy pipeline.
- Consider whether Terraform needs changes for the `/audio/` prefix or if the existing bucket config already handles it.

---

### TASK-007: Core AudioPlayer — Component & State Management

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-007 |
| **Type** | Feature |
| **Priority** | P0 |
| **Status** | Ready |
| **Feature Ref** | VG-001 |
| **Phase** | 2 — Vibe Generator MVP, Milestone 1 (Audio Player) |
| **Supersedes** | TASK-001 |

**Summary:**
Build the core `AudioPlayer` React component with HTML5 Audio API integration and all playback state management. This task is logic/state only — UI rendering is handled in TASK-008 and TASK-009.

**Acceptance Criteria:**
- [ ] Component directory: `components/audio-player/`
- [ ] Uses `useRef` for `HTMLAudioElement` — does NOT render `<audio>` with native `controls`
- [ ] Fetches `playlist.json` on mount, handles fetch failure gracefully (log error, hide player or show subtle error state — don't crash the page)
- [ ] On track end (`ended` event), advance to next track; loop back to index 0 after last track
- [ ] Autoplay on mount: set `muted = true`, call `play()`, catch rejection and set `isPlaying = false`
- [ ] All playback actions work: `play`, `pause`, `toggleMute`, `setVolume`, `nextTrack`, `prevTrack`, `toggleCollapse`
- [ ] Unmuting restores previous volume level
- [ ] No console errors on mount or during playback

**State to Manage:**
- `isPlaying` (boolean)
- `isMuted` (boolean — starts `true`)
- `volume` (number, 0–1 — persisted intent so unmuting restores previous level)
- `currentTrackIndex` (number)
- `tracks` (array, loaded from playlist.json)
- `isLoading` (boolean — true while playlist.json is being fetched)
- `isCollapsed` (boolean — starts `false`)

**Files to Create:**
- `components/audio-player/AudioPlayer.tsx`
- `components/audio-player/index.ts` (barrel export)
- Optionally: `hooks/use-audio-player.ts` if the hook logic is cleanly separable

**Files to Reference:**
- `components/HeroBackground.tsx` - Pattern for media handling
- `CLAUDE.md` - Code style conventions

**Dependencies:** TASK-006 (playlist.json must exist for testing)

**Notes:**
- Must use `'use client'` directive — audio APIs are browser-only.
- Consider `next/dynamic` with `ssr: false` if hydration issues arise (handled in TASK-011).

---

### TASK-008: Player UI — Expanded State with Retro Styling

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-008 |
| **Type** | Feature |
| **Priority** | P0 |
| **Status** | Ready |
| **Feature Ref** | VG-001 |
| **Phase** | 2 — Vibe Generator MVP, Milestone 1 (Audio Player) |

**Summary:**
Build the expanded player UI with all controls, styled to match the site's lo-fi/CRT/retro-game aesthetic.

**Acceptance Criteria:**
- [ ] Position: `fixed`, bottom-right of viewport (e.g., `bottom-4 right-4`)
- [ ] All 6 controls visible and functional: play/pause, prev track, next track, mute/unmute, volume slider, collapse button
- [ ] Visual style matches site aesthetic (lo-fi, dark, neon accents, retro feel)
- [ ] Volume slider is custom-styled (not default browser appearance) — works in Chrome and Firefox
- [ ] Hover/active states have neon glow or visual feedback
- [ ] Component does not obscure critical page content (social links, etc.)
- [ ] Looks good on desktop viewports (≥768px) — mobile is TASK-010
- [ ] Uses a reasonable `z-index` (above page content, below any future modals)

**Controls:**
- **Play/Pause** button (toggle icon)
- **Previous track** button
- **Next track** button
- **Mute/Unmute** button (toggle icon, reflects current state)
- **Volume slider** — horizontal range input, custom-styled
- **Collapse** button — minimizes to compact state (TASK-009)

**Styling Guidance:**
- Use shadcn/ui `Button` as base, layer on CRT/neon styling from `globals.css`
- Pixel font (`font-pixel` / Press Start 2P) for any text labels if added later
- Neon glow on hover/active states (reference `neon-shadow` utilities in Tailwind config)
- Dark background with slight transparency, matching the site's overlay panels
- Subtle border or outline — think retro game HUD element
- Optional: small decorative element (cassette icon, waveform) — don't over-scope

**Icons:** Use `lucide-react` (already installed via shadcn). Candidates: `Play`, `Pause`, `SkipBack`, `SkipForward`, `Volume2`, `VolumeX`, `ChevronDown`, `Minimize2`.

**Volume slider cross-browser styling:** Handle `::-webkit-slider-thumb` and `::-moz-range-thumb`.

**Files to Create/Modify:**
- `components/audio-player/PlayerControls.tsx` (or similar sub-component)
- `app/globals.css` — add any new CRT/neon utility classes if needed

**Files to Reference:**
- Existing CRT/neon styles: `app/globals.css`
- Tailwind extensions: `tailwind.config.ts` (neon shadows, font-pixel, pulse-slow)
- shadcn/ui: `components/ui/button.tsx`, `components/ui/slider.tsx`

**Dependencies:** TASK-007 (core component provides state and actions)

---

### TASK-009: Player UI — Collapsed State

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-009 |
| **Type** | Feature |
| **Priority** | P0 |
| **Status** | Ready |
| **Feature Ref** | VG-001 |
| **Phase** | 2 — Vibe Generator MVP, Milestone 1 (Audio Player) |

**Summary:**
Build the minimized/collapsed version of the player — a small fixed button that expands back to the full player.

**Acceptance Criteria:**
- [ ] When collapsed, player shrinks to a single small icon button (40–48px) in the bottom-right corner
- [ ] Collapsed button visually indicates playback state: subtle pulse/glow if playing, static if paused
- [ ] Clicking collapsed button expands back to full player (TASK-008)
- [ ] Transition between collapsed/expanded is smooth (CSS transition or scale transform)
- [ ] Collapsed button does not interfere with page content

**Icon Options:** Music note, cassette, play/pause icon — pick what fits the retro aesthetic best.

**Files to Create/Modify:**
- `components/audio-player/CollapsedPlayer.tsx` (or handled as a state within the main component)

**Files to Reference:**
- Animation utilities: `tailwind.config.ts` (`pulse-slow`), `app/globals.css`

**Dependencies:** TASK-007 (state), TASK-008 (expanded UI to toggle from)

---

### TASK-010: Audio Player — Mobile Responsive Design

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-010 |
| **Type** | Feature |
| **Priority** | P0 |
| **Status** | Ready |
| **Feature Ref** | VG-001 |
| **Phase** | 2 — Vibe Generator MVP, Milestone 1 (Audio Player) |

**Summary:**
Make the audio player compact and usable on mobile viewports.

**Acceptance Criteria:**
- [ ] On screens below `768px` (`md` breakpoint), expanded player adapts to a compact layout (full-width bottom bar or smaller floating card)
- [ ] Volume slider may be hidden behind a tap (tap volume icon to toggle slider) to save space
- [ ] Collapsed state on mobile: same small icon button, positioned to avoid overlap with bottom nav or mobile UI
- [ ] All buttons are at least 44px tap targets (Apple HIG minimum)
- [ ] Volume slider works with touch (not just mouse drag)
- [ ] No horizontal overflow or layout shift on mobile
- [ ] Looks clean on 375px-wide viewport (iPhone SE)

**Files to Modify:**
- `components/audio-player/PlayerControls.tsx`
- `components/audio-player/CollapsedPlayer.tsx`

**Files to Reference:**
- Existing responsive patterns in the site
- Tailwind responsive prefixes: `sm:`, `md:`, `lg:`

**Dependencies:** TASK-008, TASK-009 (desktop UI must exist first)

---

### TASK-011: Integration — Add Player to Site Layout

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-011 |
| **Type** | Feature |
| **Priority** | P0 |
| **Status** | Ready |
| **Feature Ref** | VG-001 |
| **Phase** | 2 — Vibe Generator MVP, Milestone 1 (Audio Player) |

**Summary:**
Mount the AudioPlayer component in the root layout so it persists across the site.

**Acceptance Criteria:**
- [ ] `<AudioPlayer />` added to `app/layout.tsx`, outside main content area
- [ ] Placed after main content in the DOM (renders on top without excessive z-index)
- [ ] No hydration mismatches — uses `'use client'` directive; use `next/dynamic` with `ssr: false` if needed
- [ ] Player does not interfere with existing page elements (hero, social links, video background, scanline overlay)
- [ ] Player z-index is correct relative to existing overlays (scanlines, noise, etc.)
- [ ] Audio begins playing muted on page load (or gracefully falls back to paused)
- [ ] No console errors or SSR warnings

**Files to Modify:**
- `app/layout.tsx`

**Files to Reference:**
- Root layout: `app/layout.tsx`
- Existing overlays and z-index layering: `globals.css`, hero component

**Dependencies:** TASK-007, TASK-008, TASK-009, TASK-010 (player must be built)

**Notes:**
- Static export means no route transitions — the player lives on the single page.
- Layout-level mount is future-proof for multi-page setup.

---

### TASK-012: Cross-Browser & Autoplay Testing

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-012 |
| **Type** | Testing |
| **Priority** | P1 |
| **Status** | Ready |
| **Feature Ref** | VG-001 |
| **Phase** | 2 — Vibe Generator MVP, Milestone 1 (Audio Player) |

**Summary:**
Verify playback, autoplay fallback, and UI rendering across major browsers and devices.

**Test Matrix:**
- Chrome (desktop + Android)
- Safari (desktop + iOS) — most restrictive autoplay policies
- Firefox (desktop)
- Edge (desktop)

**Acceptance Criteria:**
- [ ] Muted autoplay works or fallback to paused state triggers correctly on all browsers
- [ ] Volume slider renders custom-styled (not default) on all browsers
- [ ] Audio streams from CloudFront without CORS or content-type issues
- [ ] No console errors on any browser
- [ ] Mobile Safari: audio playback after user interaction (tap play) works reliably
- [ ] Player works without errors on all browsers in the test matrix
- [ ] Autoplay fallback is smooth — user sees a paused player, can tap play, no broken state

**iOS-Specific Notes:**
- `HTMLAudioElement` can be finicky on iOS Safari
- May need to handle `play()` promise rejection and/or use `playsInline` attribute patterns

**Files to Reference:**
- MDN autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide

**Dependencies:** TASK-011 (player must be integrated into the site)

---

### TASK-002: Add DALL-E API Route

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-002 |
| **Type** | Feature |
| **Priority** | P1 |
| **Status** | Ready |
| **Feature Ref** | VG-005 |
| **Phase** | 3 — AI Integration |

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
interface GenerateImageRequest {
  prompt: string;
  style: 'lofi' | 'chill' | 'ambient' | 'focus';
  size?: '1024x1024' | '1792x1024';
}

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

## Superseded Tasks

### ~~TASK-001: Create AudioPlayer Component~~

| Attribute | Value |
|-----------|-------|
| **ID** | TASK-001 |
| **Status** | Superseded |
| **Superseded By** | TASK-006 through TASK-012 |

Original single-task spec replaced with a granular 7-task breakdown for the audio player feature. See TASK-006 through TASK-012 for the detailed implementation plan.

---

## Task Status Definitions

| Status | Meaning |
|--------|---------|
| **Ready** | All requirements clear, can start immediately |
| **In Progress** | Currently being worked on |
| **Blocked** | Waiting on dependency or clarification |
| **Review** | PR submitted, awaiting review |
| **Completed** | Merged to main branch |
| **Superseded** | Replaced by newer, more detailed tasks |

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

*Last updated: March 2026*

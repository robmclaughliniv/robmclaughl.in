# /complete-task Command

> Mark a task as completed after implementation

## Purpose

Finalize a task in `docs/AGENT_QUEUE.md` after successful implementation, updating status and creating documentation.

## Usage

```
/complete-task <TASK-ID> [--pr <PR-NUMBER>]
```

## Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| TASK-ID | Task identifier (e.g., TASK-001) | Yes |
| --pr | Associated pull request number | Optional |

## Process

### 1. Verify Task Ownership

Confirm the task is assigned to current agent/session.

### 2. Run Verification

```bash
npm run build
npm run lint  # If enabled
npm test      # If tests exist
```

All must pass before completing.

### 3. Check Acceptance Criteria

Review each acceptance criterion:
- Mark as checked if complete
- Report any incomplete items

### 4. Update Task Status

Edit the task entry:

```markdown
| **Status** | Completed |
| **Completed** | <current date> |
| **PR** | #<pr-number> |
```

### 5. Move to Completed Archive

Move task entry to "Completed Tasks Archive" section at bottom of AGENT_QUEUE.md:

```markdown
| TASK-001 | Create AudioPlayer Component | 2026-01-18 | #42 |
```

### 6. Update Quick Stats

- Decrement "In Progress" count
- Increment "Completed" count (if tracked)

### 7. Update Related Documents

If applicable:
- Mark feature as "Complete" in FEATURE_BACKLOG.md
- Mark debt as "Resolved" in TECHNICAL_DEBT.md
- Update TODO.md milestones

## Example

```
/complete-task TASK-001 --pr 42
```

Output:
```
Task Completed: TASK-001
========================

Title: Create AudioPlayer Component
Status: Completed
PR: #42
Completed: 2026-01-18

Acceptance Criteria:
✅ Component file: components/AudioPlayer.tsx
✅ Play/pause button with toggle state
✅ Volume slider (0-100%)
✅ Mute button
✅ Visual audio indicator
✅ Keyboard accessibility
✅ ARIA labels
✅ Matches CRT aesthetic
✅ Responsive design
✅ localStorage persistence

Verification:
✅ Build passed
✅ Lint passed (2 warnings)
⏭️ Tests skipped (not configured)

Updated:
- docs/AGENT_QUEUE.md (status → Completed)
- docs/FEATURE_BACKLOG.md (VG-001 → Complete)

Next available tasks:
- TASK-002: Add DALL-E API Route (Ready)
- TASK-003: Fix ESLint Errors (Ready)
```

## Incomplete Criteria Handling

If acceptance criteria are not met:

```
Cannot Complete: TASK-001
=========================

Incomplete acceptance criteria:
□ Keyboard accessibility - Tab navigation not working
□ localStorage persistence - Not implemented

Options:
1. Continue working on incomplete items
2. Create follow-up task for remaining work
3. Force complete with justification (not recommended)
```

## Build Failure Handling

```
Cannot Complete: TASK-001
=========================

Build failed with errors:

Error: Type error in components/AudioPlayer.tsx:42
  'volume' is possibly 'undefined'

Fix the errors and try again.
```

## Notes

- Always verify build before completing
- Don't skip acceptance criteria
- Link PRs for traceability
- Update related docs for consistency
- Celebrate completing tasks!

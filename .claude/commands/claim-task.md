# /claim-task Command

> Claim a task from the agent queue to start working on it

## Purpose

Reserve a task from `docs/AGENT_QUEUE.md` for implementation, updating its status and creating a working branch.

## Usage

```
/claim-task <TASK-ID>
```

## Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| TASK-ID | Task identifier (e.g., TASK-001) | Yes |

## Process

### 1. Read Task

Read `docs/AGENT_QUEUE.md` and find the specified task.

### 2. Verify Task is Available

Check that task status is "Ready":
- If "In Progress": Report who has it claimed
- If "Completed": Suggest finding another task
- If "Blocked": Report blocking reason

### 3. Update Task Status

Edit the task entry:

```markdown
| **Status** | In Progress |
| **Assignee** | Agent-Session-<id> |
| **Started** | <current date> |
| **Branch** | feature/<TASK-ID>-<description> |
```

### 4. Create Working Branch

```bash
git checkout master
git pull origin master
git checkout -b feature/<TASK-ID>-<description>
```

### 5. Update Quick Stats

Update the counts in AGENT_QUEUE.md:
- Decrement "Ready" count
- Increment "In Progress" count

### 6. Report Task Details

Display:
- Task summary
- Acceptance criteria
- Files to create/modify
- Dependencies
- Technical guidance

## Example

```
/claim-task TASK-001
```

Output:
```
Task Claimed: TASK-001
======================

Title: Create AudioPlayer Component
Type: Feature
Priority: P0

Branch: feature/TASK-001-audio-player

Acceptance Criteria:
□ Component file: components/AudioPlayer.tsx
□ Play/pause button with toggle state
□ Volume slider (0-100%)
□ Mute button
□ Visual audio indicator
□ Keyboard accessibility
□ ARIA labels
□ Matches CRT aesthetic
□ Responsive design
□ localStorage persistence

Files to Create:
- components/AudioPlayer.tsx
- hooks/use-audio.ts (optional)

Files to Reference:
- components/HeroBackground.tsx
- components/ui/slider.tsx
- components/ui/button.tsx

Dependencies: None

Ready to start! Remember to:
1. Read referenced files before implementing
2. Follow code patterns in .claude/CLAUDE.md
3. Test locally with npm run dev
4. Use /complete-task when done
```

## Error Handling

### Task Not Found

```
Error: Task TASK-999 not found in AGENT_QUEUE.md

Available tasks:
- TASK-001: Create AudioPlayer Component (Ready)
- TASK-002: Add DALL-E API Route (Ready)
- TASK-003: Fix ESLint Errors (Ready)
```

### Task Already Claimed

```
Error: Task TASK-001 is already in progress

Claimed by: Agent-Session-123
Started: 2026-01-17

Would you like to:
1. Work on a different task
2. Force-claim (requires justification)
```

### Task is Blocked

```
Error: Task TASK-005 is blocked

Reason: Depends on TASK-001 (AudioPlayer)

Would you like to claim TASK-001 instead?
```

## Notes

- Only claim one task at a time
- Complete or release tasks before claiming new ones
- Keep task progress updated
- If abandoning a task, update status back to "Ready"

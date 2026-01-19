# /commit-push-pr Command

> Create a commit, push to remote, and create a pull request

## Purpose

Streamline the git workflow for shipping changes by automating commit, push, and PR creation.

## Usage

```
/commit-push-pr [commit message]
```

## Steps

1. **Check git status**
   ```bash
   git status
   ```
   - Identify changed files
   - Note any untracked files

2. **Stage changes**
   ```bash
   git add .
   ```
   - Or selectively stage if requested

3. **Create commit**
   ```bash
   git commit -m "<message>"
   ```
   - Use provided message or generate one
   - Follow commit message format:
     ```
     <type>: <description>

     <body>

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```

4. **Push to remote**
   ```bash
   git push -u origin <branch>
   ```
   - Create remote branch if needed

5. **Create pull request**
   ```bash
   gh pr create --title "<title>" --body "<body>"
   ```
   - Generate PR description from commits
   - Include task references

## Commit Message Format

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### Example
```
feat: add audio player component

- Implement play/pause functionality
- Add volume control
- Include keyboard accessibility

Refs: TASK-001

Co-Authored-By: Claude <noreply@anthropic.com>
```

## PR Description Template

```markdown
## Summary
Brief description of changes.

## Changes
- Change 1
- Change 2

## Testing
- How to verify these changes

## Related
- TASK-XXX
- Closes #XX
```

## Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| message | Commit message (or auto-generate) | Optional |

## Example

```
/commit-push-pr feat: add channel selector component
```

Output:
```
Commit: feat: add channel selector component
Branch: feature/TASK-005-channel-selector
PR: #42 - feat: add channel selector component [TASK-005]
URL: https://github.com/robmclaughliniv/robmclaughl.in/pull/42
```

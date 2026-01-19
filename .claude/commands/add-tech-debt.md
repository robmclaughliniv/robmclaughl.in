# /add-tech-debt Command

> Document a new technical debt item

## Purpose

Add a new technical debt entry to the registry with proper tracking and resolution guidance.

## Usage

```
/add-tech-debt "<issue title>" --priority <high|medium|low> --location "<file/area>"
```

## Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| title | Brief issue title | Yes |
| --priority | high, medium, low | Yes |
| --location | File path or general area | Yes |

## Process

### 1. Determine Next ID

Read `docs/TECHNICAL_DEBT.md` and find next available TD-XXX ID.

### 2. Gather Information

Prompt for:
- Current state (what exists now)
- Problem (why it's an issue)
- Resolution steps
- Effort estimate (optional)

### 3. Format Entry

```markdown
### TD-XXX: <Title>

| Attribute | Value |
|-----------|-------|
| **ID** | TD-XXX |
| **Priority** | <priority> |
| **Location** | `<location>` |
| **Impact** | <impact description> |
| **Effort** | <estimate> |

**Current State:**
<current state description>

**Problem:**
<why this is an issue>

**Resolution:**
1. Step 1
2. Step 2
3. Step 3

**Dependencies:** <dependencies or "None">
```

### 4. Update TECHNICAL_DEBT.md

Insert in appropriate priority section.

### 5. Update Summary

Update the count in the summary table.

## Example

```
/add-tech-debt "Missing input validation on API" --priority high --location "lambda_src/src/handlers/"
```

Prompts for:
- Current State: "API endpoints accept any input without validation"
- Problem: "Could lead to injection attacks or unexpected behavior"
- Resolution:
  1. Add Zod schemas for all request types
  2. Validate input at handler entry point
  3. Return 400 for invalid input

Generates:

```markdown
### TD-010: Missing Input Validation on API

| Attribute | Value |
|-----------|-------|
| **ID** | TD-010 |
| **Priority** | High |
| **Location** | `lambda_src/src/handlers/` |
| **Impact** | Security vulnerability, potential injection |
| **Effort** | 2-3 hours |

**Current State:**
API endpoints accept any input without validation.

**Problem:**
Could lead to injection attacks or unexpected behavior. User input goes directly to database operations.

**Resolution:**
1. Add Zod schemas for all request types
2. Validate input at handler entry point
3. Return 400 Bad Request for invalid input
4. Add test cases for validation

**Dependencies:** None
```

## Output

```
Technical Debt Added
====================

ID: TD-010
Title: Missing Input Validation on API
Priority: High
Location: lambda_src/src/handlers/
File: docs/TECHNICAL_DEBT.md

Consider adding to AGENT_QUEUE.md if:
- This is blocking other work
- It's a security issue
- It's a quick fix
```

## Priority Guidelines

| Priority | Criteria |
|----------|----------|
| High | Security issues, blocking development, data integrity |
| Medium | Code quality, maintainability, performance |
| Low | Cosmetic, naming, nice-to-have improvements |

## Notes

- Be specific about location
- Include code examples if helpful
- Consider if it should be a task immediately
- Update resolution tracking table

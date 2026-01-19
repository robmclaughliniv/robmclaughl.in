# /add-feature Command

> Add a new feature to the backlog

## Purpose

Document a new feature request in the feature backlog with proper formatting and tracking.

## Usage

```
/add-feature "<feature title>" --priority <P0|P1|P2|P3> --category <category>
```

## Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| title | Feature title (in quotes) | Yes |
| --priority | P0=MVP, P1=Core, P2=Enhanced, P3=Future | Yes |
| --category | vibe, platform, homepage, etc. | Yes |

## Process

### 1. Determine Next ID

Read `docs/FEATURE_BACKLOG.md` and find the next available ID in the category:
- Vibe Generator: VG-XXX
- Multi-App: MA-XXX
- Homepage: HP-XXX

### 2. Gather Information

Prompt for:
- Detailed description
- Requirements (list)
- Technical notes
- Dependencies

### 3. Format Entry

```markdown
#### <ID>: <Title>
| Attribute | Value |
|-----------|-------|
| **ID** | <ID> |
| **Priority** | <priority> |
| **Category** | <category> |
| **Status** | Not Started |

**Description:**
<description>

**Requirements:**
- Requirement 1
- Requirement 2

**Technical Notes:**
<notes>

**Dependencies:** <dependencies or "None">
```

### 4. Update FEATURE_BACKLOG.md

Insert the new feature in the appropriate section based on category and priority.

### 5. Update Summary Table

Update the feature counts in the summary section.

## Example

```
/add-feature "User favorites system" --priority P2 --category vibe
```

Prompts for:
- Description: "Allow users to save favorite generated visuals and tracks"
- Requirements:
  - Heart/star button on generations
  - Favorites gallery view
  - Persist to localStorage
- Technical Notes: "Consider cloud sync in future"
- Dependencies: "VG-005 (DALL-E), VG-006 (Suno)"

Generates:

```markdown
#### VG-014: User Favorites System
| Attribute | Value |
|-----------|-------|
| **ID** | VG-014 |
| **Priority** | P2 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Allow users to save favorite generated visuals and tracks.

**Requirements:**
- Heart/star button on generations
- Favorites gallery view
- Persist to localStorage

**Technical Notes:**
Consider cloud sync in future.

**Dependencies:** VG-005 (DALL-E), VG-006 (Suno)
```

## Output

```
Feature Added
=============

ID: VG-014
Title: User Favorites System
Priority: P2
Category: Vibe Generator
File: docs/FEATURE_BACKLOG.md

Next steps:
- Review feature with stakeholders
- When ready, create task in AGENT_QUEUE.md
```

## Notes

- Always read the backlog first to get correct ID
- Maintain consistent formatting
- Link related features in dependencies
- Update last modified date

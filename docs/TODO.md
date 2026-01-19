# Project Roadmap

> High-level project phases and milestones

## Current Phase

**Phase 1: Foundation & Cleanup**
- Status: In Progress
- Goal: Establish solid documentation and fix technical debt

---

## Phase Overview

```
Phase 1: Foundation & Cleanup     ← CURRENT
    ↓
Phase 2: Vibe Generator MVP
    ↓
Phase 3: AI Integration
    ↓
Phase 4: Multi-App Platform
    ↓
Phase 5: Polish & Scale
```

---

## Phase 1: Foundation & Cleanup

**Status:** In Progress
**Goal:** Clean codebase, comprehensive documentation, quality gates

### Milestones

- [x] Create documentation structure (`.claude/`, `docs/`)
- [x] Write agent guide (`.claude/CLAUDE.md`)
- [x] Document architecture (`docs/ARCHITECTURE.md`)
- [x] Catalog technical debt (`docs/TECHNICAL_DEBT.md`)
- [x] Define feature backlog (`docs/FEATURE_BACKLOG.md`)
- [x] Establish task queue (`docs/AGENT_QUEUE.md`)
- [ ] Fix duplicate hooks (TD-003, TD-004)
- [ ] Remove console.log statements (TD-006)
- [ ] Fix ESLint/TypeScript errors (TD-001)
- [ ] Update package.json name (TD-008)

### Success Criteria

- All documentation in place
- `npm run build` succeeds with linting enabled
- No duplicate files in codebase
- Agent can work effectively with docs

---

## Phase 2: Vibe Generator MVP

**Status:** Not Started
**Goal:** Launch minimal viable Vibe Generator

### Milestones

- [ ] Create AudioPlayer component (TASK-001)
- [ ] Create ChannelSelector component (TASK-005)
- [ ] Add visual backgrounds
- [ ] Implement volume controls
- [ ] Create `/vibe` route
- [ ] Deploy MVP to production

### Success Criteria

- Users can play lofi music
- 3+ channels available
- Visual backgrounds match mood
- Mobile responsive
- Deployed at robmclaughl.in/vibe

### Dependencies

- Phase 1 completion (clean codebase)

---

## Phase 3: AI Integration

**Status:** Not Started
**Goal:** Add DALL-E and Suno AI generation features

### Milestones

- [ ] Set up OpenAI API integration
- [ ] Create image generation endpoint
- [ ] Research Suno API
- [ ] Create music generation endpoint
- [ ] Implement rate limiting
- [ ] Add CAPTCHA protection
- [ ] Build cost tracking dashboard

### Success Criteria

- Users can generate unique visuals
- Users can generate unique tracks (pending Suno)
- Costs are controlled and tracked
- Abuse prevention in place

### Dependencies

- Phase 2 completion (MVP working)
- API accounts and keys
- Budget allocation for API costs

---

## Phase 4: Multi-App Platform

**Status:** Not Started
**Goal:** Transform site into multi-app platform

### Milestones

- [ ] Implement path-based routing
- [ ] Create shared component library
- [ ] Build app registry
- [ ] Design navigation system
- [ ] Create homepage app grid
- [ ] Plan additional apps

### Success Criteria

- Multiple apps accessible at /[app] paths
- Consistent navigation across apps
- Easy to add new apps
- Registry drives homepage

### Dependencies

- Phase 3 completion (flagship app polished)

---

## Phase 5: Polish & Scale

**Status:** Not Started
**Goal:** Production-ready, scalable platform

### Milestones

- [ ] Implement comprehensive test suite
- [ ] Add error boundaries
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] SEO optimization
- [ ] Analytics integration
- [ ] User feedback mechanism
- [ ] Mobile app consideration

### Success Criteria

- 90%+ test coverage on critical paths
- Lighthouse score > 90
- WCAG 2.1 AA compliant
- Sub-second page loads

### Dependencies

- Phase 4 completion (platform established)

---

## Parking Lot

Ideas for future consideration (not scheduled):

### Features
- User authentication/accounts
- User-created playlists
- Community features
- Premium/subscription tier
- Mobile native app
- Browser extension

### Technical
- Edge functions (Cloudflare Workers)
- Real-time sync (WebSockets)
- Offline support (PWA)
- i18n/localization

### Content
- Blog/writing section
- Portfolio showcase
- Project documentation
- Tutorials/guides

---

## Quick Reference

| Phase | Status | Key Deliverable |
|-------|--------|-----------------|
| 1. Foundation | In Progress | Clean, documented codebase |
| 2. Vibe MVP | Not Started | Working music player |
| 3. AI Integration | Not Started | Generative features |
| 4. Multi-App | Not Started | Platform infrastructure |
| 5. Polish | Not Started | Production quality |

---

## Related Documents

- [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) - Detailed feature specs
- [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) - Debt to address
- [AGENT_QUEUE.md](./AGENT_QUEUE.md) - Ready tasks

---

*Last updated: January 2026*

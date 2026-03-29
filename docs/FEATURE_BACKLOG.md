# Feature Backlog

> Prioritized list of planned features for robmclaughl.in

## Priority Legend

| Priority | Meaning | Criteria |
|----------|---------|----------|
| **P0** | MVP Required | Must have for initial launch |
| **P1** | Core Feature | Adds significant value |
| **P2** | Enhanced | Nice to have, improves UX |
| **P3** | Future | Deferred for later consideration |

---

## Summary by Category

| Category | P0 | P1 | P2 | Total |
|----------|----|----|----|----- |
| Vibe Generator | 4 | 5 | 4 | 13 |
| Multi-App Platform | 0 | 3 | 3 | 6 |
| Homepage | 0 | 3 | 2 | 5 |
| **Total** | **4** | **11** | **9** | **24** |

---

## 1. Vibe Generator (Flagship App)

### P0 - MVP Required

#### VG-001: Audio Player Component
| Attribute | Value |
|-----------|-------|
| **ID** | VG-001 |
| **Priority** | P0 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Create a core audio player component that plays lofi background music streams. Should include play/pause controls, volume slider, and visual audio waveform feedback.

**Requirements:**
- Play/pause toggle button
- Volume control slider (0-100%)
- Visual waveform or equalizer animation
- Support for streaming audio URLs
- Responsive design matching CRT aesthetic
- Accessibility: keyboard controls, ARIA labels

**Technical Notes:**
- Use HTML5 Audio API
- Consider Web Audio API for visualizations
- Store volume preference in localStorage
- Handle autoplay restrictions gracefully

**Dependencies:** None

---

#### VG-002: Channel Selector
| Attribute | Value |
|-----------|-------|
| **ID** | VG-002 |
| **Priority** | P0 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Allow users to select from multiple lofi music "channels" or stations. Each channel provides a different vibe/mood.

**Requirements:**
- Dropdown or tab-based channel selector
- At least 3 initial channels:
  - Chill/Relaxing
  - Focus/Productivity
  - Late Night/Ambient
- Channel switching without audio gap (if possible)
- Visual indicator of current channel
- Channel descriptions/mood indicators

**Technical Notes:**
- Each channel = different audio stream URL
- May integrate with Suno API for generated music (P1)
- Consider caching recent channel for quick switching

**Dependencies:** VG-001 (Audio Player)

---

#### VG-003: Visual Backgrounds
| Attribute | Value |
|-----------|-------|
| **ID** | VG-003 |
| **Priority** | P0 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Display atmospheric visual backgrounds that match the music mood. Can be videos, animated GIFs, or generative visuals.

**Requirements:**
- Full-screen background layer
- Sync with channel/mood selection
- Smooth transitions between backgrounds
- Performance optimized (lazy loading)
- Fallback for slow connections
- Respects reduced motion preferences

**Technical Notes:**
- Extend existing HeroBackground component pattern
- Videos should be compressed (< 5MB each)
- Consider WebP animated images as alternative
- May integrate with DALL-E for generated visuals (P1)

**Dependencies:** VG-002 (Channel Selector)

---

#### VG-004: Volume/Mute Controls
| Attribute | Value |
|-----------|-------|
| **ID** | VG-004 |
| **Priority** | P0 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Comprehensive volume controls including mute toggle, volume slider, and keyboard shortcuts.

**Requirements:**
- Mute/unmute button with clear icon state
- Volume slider (vertical or horizontal)
- Keyboard shortcuts: M (mute), Up/Down arrows
- Remember volume across sessions
- Visual feedback on volume change

**Technical Notes:**
- Part of AudioPlayer component
- Persist to localStorage
- Consider volume normalization across channels

**Dependencies:** VG-001 (Audio Player)

---

### P1 - Core Features

#### VG-005: DALL-E Visual Generation
| Attribute | Value |
|-----------|-------|
| **ID** | VG-005 |
| **Priority** | P1 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Generate unique visual backgrounds using DALL-E API based on mood/channel selection.

**Requirements:**
- Generate images matching channel mood
- "Generate New Visual" button
- Loading state during generation
- Cache generated images
- Fallback to static images on failure
- Cost tracking and limits

**Technical Notes:**
- DALL-E 3 API via OpenAI
- Estimated cost: $0.04-0.08 per image
- Need Lambda endpoint for API calls
- Store generated images in S3 for reuse
- Implement rate limiting (see VG-007)

**Dependencies:** VG-003 (Visual Backgrounds), SECURITY.md guidelines

**See Also:** [API_INTEGRATION.md](./API_INTEGRATION.md), [RESEARCH.md](./RESEARCH.md)

---

#### VG-006: Suno Music Generation
| Attribute | Value |
|-----------|-------|
| **ID** | VG-006 |
| **Priority** | P1 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Generate unique lofi tracks using Suno AI music generation API.

**Requirements:**
- "Generate New Track" button
- Mood/style parameters for generation
- Queue system for generated tracks
- Download generated tracks (optional)
- Clear attribution/licensing display

**Technical Notes:**
- Suno API (requires research)
- Audio generation takes time - need async handling
- Store generated audio in S3
- Consider credits/token system

**Dependencies:** VG-001 (Audio Player), VG-007 (Rate Limiting)

**See Also:** [RESEARCH.md](./RESEARCH.md) for Suno API details

---

#### VG-007: Rate Limiting
| Attribute | Value |
|-----------|-------|
| **ID** | VG-007 |
| **Priority** | P1 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Implement rate limiting for AI generation features to control costs and prevent abuse.

**Requirements:**
- Per-user generation limits
- Daily/hourly quotas
- Clear display of remaining generations
- Graceful handling when limit reached
- Optional: higher limits for authenticated users

**Technical Notes:**
- Track in DynamoDB by IP or session ID
- Consider token bucket algorithm
- Default limits:
  - Images: 5/hour, 20/day
  - Music: 3/hour, 10/day
- Store in `rate-limits` table

**Dependencies:** Lambda backend infrastructure

---

#### VG-008: CAPTCHA Protection
| Attribute | Value |
|-----------|-------|
| **ID** | VG-008 |
| **Priority** | P1 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Add CAPTCHA verification before AI generation to prevent bot abuse.

**Requirements:**
- Invisible CAPTCHA (low friction)
- Verify before generation API calls
- Fallback to visible CAPTCHA if suspicious
- Block requests failing CAPTCHA

**Technical Notes:**
- Consider Cloudflare Turnstile (free) or hCaptcha
- Integrate verification in Lambda
- Store verification tokens temporarily

**Dependencies:** VG-005 or VG-006 (AI Generation features)

---

#### VG-009: Cost Tracking Dashboard
| Attribute | Value |
|-----------|-------|
| **ID** | VG-009 |
| **Priority** | P1 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Admin dashboard to track API costs and usage for AI generation features.

**Requirements:**
- Daily/weekly/monthly cost summaries
- Usage graphs per API (DALL-E, Suno)
- Alert thresholds for cost limits
- Export data for billing analysis

**Technical Notes:**
- Store usage logs in DynamoDB
- Calculate costs based on API pricing
- Admin-only access (future auth system)
- Could use CloudWatch for initial metrics

**Dependencies:** VG-005, VG-006 (AI features to track)

---

### P2 - Enhanced Features

#### VG-010: Theme Variations
| Attribute | Value |
|-----------|-------|
| **ID** | VG-010 |
| **Priority** | P2 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Multiple visual themes beyond the default CRT aesthetic.

**Requirements:**
- Theme selector in settings
- Themes: CRT (default), Minimal, Neon, Nature
- Theme persisted to localStorage
- Smooth theme transitions

**Dependencies:** VG-003 (Visual Backgrounds)

---

#### VG-011: Keyboard Shortcuts
| Attribute | Value |
|-----------|-------|
| **ID** | VG-011 |
| **Priority** | P2 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Comprehensive keyboard shortcuts for power users.

**Requirements:**
- Space: Play/Pause
- M: Mute/Unmute
- Up/Down: Volume
- Left/Right: Previous/Next channel
- G: Generate new (with confirmation)
- ?: Show shortcuts help

**Dependencies:** VG-001, VG-002, VG-004

---

#### VG-012: Share/Embed
| Attribute | Value |
|-----------|-------|
| **ID** | VG-012 |
| **Priority** | P2 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Allow users to share their current vibe configuration or embed the player.

**Requirements:**
- Share URL with channel/settings encoded
- Copy link button
- Social media share buttons
- Embeddable iframe version

**Dependencies:** VG-001, VG-002

---

#### VG-013: Favorites/History
| Attribute | Value |
|-----------|-------|
| **ID** | VG-013 |
| **Priority** | P2 |
| **Category** | Vibe Generator |
| **Status** | Not Started |

**Description:**
Save favorite generated visuals and tracks for later.

**Requirements:**
- Heart/star button on generations
- Favorites gallery view
- Recently played/generated history
- Clear history option
- localStorage or cloud sync (future)

**Dependencies:** VG-005, VG-006

---

## 2. Multi-App Platform

### P1 - Core Platform

#### MA-001: Path-Based App Routing
| Attribute | Value |
|-----------|-------|
| **ID** | MA-001 |
| **Priority** | P1 |
| **Category** | Platform |
| **Status** | Not Started |

**Description:**
Support multiple apps under path routes (e.g., robmclaughl.in/vibe, robmclaughl.in/tools).

**Requirements:**
- Clean URL structure: /vibe, /tools, /art
- Shared layout components
- Individual app entry points
- Proper meta tags per app
- Navigation between apps

**Technical Notes:**
- Use Next.js App Router dynamic routes
- Create `app/[app]/page.tsx` pattern
- Shared components in `components/shared/`

**Dependencies:** None

---

#### MA-002: Shared Component Library
| Attribute | Value |
|-----------|-------|
| **ID** | MA-002 |
| **Priority** | P1 |
| **Category** | Platform |
| **Status** | Not Started |

**Description:**
Create shared UI components usable across all apps.

**Requirements:**
- Navigation header component
- Footer component
- App card/tile component
- Loading states
- Error states
- All with CRT aesthetic

**Dependencies:** MA-001

---

#### MA-003: App Registry
| Attribute | Value |
|-----------|-------|
| **ID** | MA-003 |
| **Priority** | P1 |
| **Category** | Platform |
| **Status** | Not Started |

**Description:**
Central registry of all available apps with metadata.

**Requirements:**
- App list with name, description, icon
- Status (active, coming soon, beta)
- Feature flags for app visibility
- Dynamic homepage based on registry

**Technical Notes:**
- Could be JSON config file initially
- Later: DynamoDB for dynamic updates

**Dependencies:** MA-001

---

### P2 - App Concepts

#### MA-004: Tools Subdomain/Path
| Attribute | Value |
|-----------|-------|
| **ID** | MA-004 |
| **Priority** | P2 |
| **Category** | Platform |
| **Status** | Concept |

**Description:**
Collection of useful web tools (converters, formatters, etc.).

**Initial Tool Ideas:**
- JSON formatter/validator
- Color palette generator
- Markdown preview
- Base64 encoder/decoder

**Dependencies:** MA-001, MA-002

---

#### MA-005: Music Subdomain/Path
| Attribute | Value |
|-----------|-------|
| **ID** | MA-005 |
| **Priority** | P2 |
| **Category** | Platform |
| **Status** | Concept |

**Description:**
Standalone version of the Vibe Generator for music focus.

**Dependencies:** VG-001 through VG-004 (MVP Vibe Generator)

---

#### MA-006: Art Subdomain/Path
| Attribute | Value |
|-----------|-------|
| **ID** | MA-006 |
| **Priority** | P2 |
| **Category** | Platform |
| **Status** | Concept |

**Description:**
AI art generation playground using DALL-E.

**Dependencies:** VG-005 (DALL-E integration)

---

## 3. Homepage Enhancements

### P1 - Core Enhancements

#### HP-001: CTA Button to Vibe Generator
| Attribute | Value |
|-----------|-------|
| **ID** | HP-001 |
| **Priority** | P1 |
| **Category** | Homepage |
| **Status** | Not Started |

**Description:**
Add prominent call-to-action button linking to the Vibe Generator app.

**Requirements:**
- Positioned below bio section
- CRT-styled button with glow effect
- Hover animation
- Clear "Try Vibe Generator" text

**Dependencies:** VG-001 through VG-004 (Vibe Generator MVP)

---

#### HP-002: Subtle Background Audio
| Attribute | Value |
|-----------|-------|
| **ID** | HP-002 |
| **Priority** | P1 |
| **Category** | Homepage |
| **Status** | Not Started |

**Description:**
Optional ambient audio on the homepage (user-initiated).

**Requirements:**
- Click-to-play interaction (no autoplay)
- Small audio toggle in corner
- Very subtle ambient sounds
- Muted by default
- Remember preference

**Dependencies:** VG-001 (Audio Player component)

---

#### HP-003: Mobile CRT Effects
| Attribute | Value |
|-----------|-------|
| **ID** | HP-003 |
| **Priority** | P1 |
| **Category** | Homepage |
| **Status** | Not Started |

**Description:**
Enable CRT visual effects on mobile devices (currently disabled).

**Requirements:**
- Performance-optimized mobile effects
- Reduced scanline density
- Test on various devices
- Option to disable if laggy

**Technical Notes:**
- Current: CRT effects only on desktop
- Need to balance visual quality vs. performance
- Consider CSS-only effects for mobile

**Dependencies:** None

---

### P2 - Future Enhancements

#### HP-004: Blog Section
| Attribute | Value |
|-----------|-------|
| **ID** | HP-004 |
| **Priority** | P2 |
| **Category** | Homepage |
| **Status** | Concept |

**Description:**
Add a simple blog for technical writing and updates.

**Requirements:**
- Markdown-based posts
- List of recent posts
- Individual post pages
- Code syntax highlighting
- CRT aesthetic for blog UI

**Technical Notes:**
- Could use MDX for posts
- Static generation at build time

**Dependencies:** MA-001 (routing)

---

#### HP-005: Portfolio Section
| Attribute | Value |
|-----------|-------|
| **ID** | HP-005 |
| **Priority** | P2 |
| **Category** | Homepage |
| **Status** | Concept |

**Description:**
Showcase personal projects and work history.

**Requirements:**
- Project cards with images
- Links to live demos/repos
- Skills/technologies display
- Timeline of experience

**Dependencies:** MA-002 (shared components)

---

## Backlog Management

### Adding New Features

1. Create new entry with next available ID in category
2. Fill out all attribute fields
3. Determine priority based on:
   - P0: Required for initial functionality
   - P1: Adds significant user value
   - P2: Nice to have, improves experience
   - P3: Future consideration
4. Document dependencies clearly
5. Update summary table counts
6. Consider adding to AGENT_QUEUE.md if ready to implement

### Moving to Development

When a feature is ready for implementation:
1. Create task entry in AGENT_QUEUE.md
2. Update status to "In Progress"
3. Link to any related PRs
4. Update status to "Complete" when merged

---

*Last updated: January 2026*

# Vibe Generator Specification

> Flagship app: AI-powered lofi music and visual experience

## Overview

The Vibe Generator is an interactive web experience combining lofi music streaming with AI-generated visuals. Users can relax, focus, or vibe out with customizable audio channels and dynamic backgrounds.

---

## User Experience

### Primary Flow

```
1. User visits robmclaughl.in/vibe
2. Page loads with default channel playing
3. Background visual matches mood
4. User can:
   - Change channels
   - Adjust volume
   - Generate new visual (AI)
   - Generate new track (AI)
   - Toggle fullscreen
```

### User Interface Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    [AI-Generated Background]                     │
│                                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    VIBE GENERATOR                        │   │
│  │                                                          │   │
│  │  Channel: [Chill Vibes ▼]                               │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │  ▶  ████████░░░░░░░░░░░░░░░░░░  2:34 / ∞        │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Volume: ────●───────  [🔊]                             │   │
│  │                                                          │   │
│  │  [🎨 New Visual]  [🎵 New Track]                        │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [⛶ Fullscreen]  [⚙ Settings]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### Component Structure

```
app/vibe/
├── page.tsx              # Main page (server component)
├── layout.tsx            # Vibe-specific layout
└── components/
    ├── VibePlayer.tsx    # Main client component
    ├── AudioPlayer.tsx   # Audio controls
    ├── ChannelSelector.tsx
    ├── VolumeControl.tsx
    ├── VisualBackground.tsx
    └── GenerationControls.tsx
```

### State Management

```typescript
interface VibeState {
  // Audio state
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;

  // Channel state
  activeChannel: Channel;
  channels: Channel[];

  // Visual state
  currentVisual: Visual;
  isGeneratingVisual: boolean;

  // AI generation
  remainingGenerations: {
    images: number;
    tracks: number;
  };
}
```

### Data Models

```typescript
interface Channel {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  mood: 'chill' | 'focus' | 'ambient' | 'late-night';
  color: string;  // Accent color for UI
}

interface Visual {
  id: string;
  url: string;
  prompt?: string;  // If AI-generated
  source: 'static' | 'dalle' | 'user';
  channelId: string;
}

interface GenerationRequest {
  type: 'image' | 'music';
  mood: string;
  style?: string;
}
```

---

## Feature Details

### Audio Player (VG-001)

**Components:**
- Play/Pause button
- Progress indicator (for finite tracks) or duration counter
- Loading state during buffer
- Error state with retry

**Audio Sources:**
1. **Streaming URLs** - External lofi radio streams
2. **Static files** - Pre-recorded tracks in S3
3. **AI-generated** - Suno-generated tracks (future)

**Considerations:**
- Handle autoplay restrictions (user gesture required)
- Implement audio context for visualizations
- Support background audio (keep playing when tab unfocused)

### Channel Selector (VG-002)

**Initial Channels:**

| Channel | Mood | Description |
|---------|------|-------------|
| Chill Vibes | chill | Relaxing lofi beats for unwinding |
| Deep Focus | focus | Minimal, concentration-friendly |
| Late Night | ambient | Atmospheric, dreamy soundscapes |
| Retro Wave | late-night | Synthwave-inspired lofi |

**Behavior:**
- Smooth crossfade between channels (if possible)
- Remember last channel in localStorage
- Show current listeners count (future)

### Visual Backgrounds (VG-003)

**Static Visuals:**
Each channel has 3-5 curated background images/videos matching its mood.

**Dynamic Generation:**
- DALL-E 3 generates images based on mood + current time
- Prompt template: `Lofi aesthetic {mood} scene, {time_of_day}, cozy, warm lighting, detailed, digital art`

**Visual Types:**
1. Static images (WebP, optimized)
2. Looping videos (MP4, max 5MB)
3. CSS animations (particle effects, etc.)

### AI Generation (VG-005, VG-006)

**Image Generation Flow:**
```
1. User clicks "New Visual"
2. Check rate limit (VG-007)
3. Show CAPTCHA if needed (VG-008)
4. Send request to Lambda
5. Lambda calls DALL-E API
6. Return image URL
7. Fade in new background
8. Log usage for cost tracking (VG-009)
```

**Music Generation Flow:**
```
1. User clicks "New Track"
2. Check rate limit
3. Show CAPTCHA if needed
4. Send request to Lambda
5. Lambda calls Suno API
6. Wait for generation (may take 30s+)
7. Return audio URL
8. Add to player queue
9. Log usage
```

---

## API Endpoints

### GET /api/vibe/channels

Returns available channels.

```json
{
  "channels": [
    {
      "id": "chill",
      "name": "Chill Vibes",
      "description": "Relaxing lofi beats",
      "streamUrl": "https://...",
      "mood": "chill"
    }
  ]
}
```

### POST /api/vibe/generate-image

Generate a new visual background.

**Request:**
```json
{
  "mood": "chill",
  "style": "cozy room",
  "captchaToken": "..."
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://...",
  "remainingGenerations": 4,
  "requestId": "uuid"
}
```

### POST /api/vibe/generate-track

Generate a new music track.

**Request:**
```json
{
  "mood": "focus",
  "style": "minimal lofi",
  "captchaToken": "..."
}
```

**Response:**
```json
{
  "success": true,
  "trackUrl": "https://...",
  "title": "Midnight Study Session",
  "duration": 180,
  "remainingGenerations": 2,
  "requestId": "uuid"
}
```

---

## Rate Limiting

### Default Limits

| Feature | Per Hour | Per Day |
|---------|----------|---------|
| Image Generation | 5 | 20 |
| Music Generation | 3 | 10 |

### Implementation

```typescript
interface RateLimitEntry {
  userId: string;        // Session ID or IP hash
  feature: 'image' | 'music';
  count: number;
  windowStart: string;   // ISO timestamp
  ttl: number;          // DynamoDB TTL
}
```

**DynamoDB Table:** `vibe-rate-limits`

**Logic:**
1. Get current count for user + feature
2. If count >= limit, return 429
3. Otherwise, increment and allow

---

## Cost Projections

### Per-Generation Costs

| Service | API | Cost per Unit |
|---------|-----|---------------|
| DALL-E 3 | 1024x1024 | ~$0.04 |
| DALL-E 3 | 1792x1024 | ~$0.08 |
| Suno | Standard | ~$0.10 (estimated) |

### Monthly Budget Scenarios

| Scenario | Daily Users | Generations | Monthly Cost |
|----------|-------------|-------------|--------------|
| Low | 10 | 50/day | ~$60 |
| Medium | 100 | 500/day | ~$600 |
| High | 1000 | 5000/day | ~$6000 |

### Cost Controls

1. **Hard limits** - API calls capped per day
2. **Budget alerts** - CloudWatch alerts at thresholds
3. **Circuit breaker** - Disable generation at budget cap
4. **Rate limits** - Per-user limits (above)

---

## Visual Design

### CRT Aesthetic Integration

The Vibe Generator maintains the site's lo-fi CRT aesthetic:

**Colors:**
- Background: `#0d1025` (deep purple-blue)
- Primary accent: `#ec4899` (pink-500)
- Secondary accent: `#22d3ee` (cyan-400)
- Text: `#e4e4e7` (zinc-200)

**Effects:**
- Scanline overlay (CSS)
- Subtle flicker animations
- Neon glow on interactive elements
- Pixel font for headers

**CSS Classes:**
```css
.vibe-container {
  @apply relative bg-zinc-950;
}

.vibe-panel {
  @apply bg-zinc-900/80 backdrop-blur-sm border border-zinc-800;
  @apply rounded-lg shadow-lg;
}

.vibe-button {
  @apply bg-pink-500/20 hover:bg-pink-500/30;
  @apply border border-pink-500/50;
  @apply text-pink-400 hover:text-pink-300;
  @apply transition-all duration-300;
}

.vibe-glow {
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
}
```

---

## Accessibility

### Requirements

- **Keyboard navigation** - All controls accessible via Tab/Enter
- **Screen reader support** - ARIA labels on all interactive elements
- **Reduced motion** - Respect `prefers-reduced-motion`
- **Color contrast** - WCAG AA minimum (4.5:1)
- **Focus indicators** - Visible focus rings

### ARIA Labels

```tsx
<button
  aria-label={isPlaying ? "Pause audio" : "Play audio"}
  aria-pressed={isPlaying}
>
  {isPlaying ? <PauseIcon /> : <PlayIcon />}
</button>

<input
  type="range"
  aria-label="Volume control"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={volume}
/>
```

---

## Mobile Considerations

### Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (mobile) | Stacked, minimal UI |
| 640-1024px (tablet) | Compact horizontal |
| > 1024px (desktop) | Full layout |

### Mobile-Specific Behavior

- Touch-friendly controls (larger hit targets)
- Swipe gestures for channel switching
- Simplified visual effects (performance)
- Battery-aware background processing

---

## Testing Strategy

### Unit Tests

- AudioPlayer state management
- Volume calculations
- Rate limit logic
- API response parsing

### Integration Tests

- Channel switching flow
- Generation request/response
- Error handling scenarios

### E2E Tests

- Full user journey
- Mobile viewport
- Keyboard navigation

### Performance Tests

- Audio loading time < 2s
- Visual transition smoothness
- Memory usage under 100MB

---

## Launch Checklist

### MVP (Phase 2)

- [ ] Audio player component complete
- [ ] 3+ channels configured
- [ ] Static visuals for each channel
- [ ] Volume controls working
- [ ] Mobile responsive
- [ ] Deployed to /vibe route

### AI Features (Phase 3)

- [ ] DALL-E integration working
- [ ] Rate limiting active
- [ ] CAPTCHA protection enabled
- [ ] Cost tracking dashboard
- [ ] Suno integration (if available)

---

## Related Documents

- [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) - Feature details
- [API_INTEGRATION.md](./API_INTEGRATION.md) - API specifics
- [SECURITY.md](./SECURITY.md) - Security requirements
- [RESEARCH.md](./RESEARCH.md) - API research

---

*Last updated: January 2026*

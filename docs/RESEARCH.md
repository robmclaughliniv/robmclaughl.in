# Research Notes

> API research, technical investigations, and findings

## Overview

This document contains research notes for technologies and APIs being evaluated for integration into robmclaughl.in.

---

## Table of Contents

1. [Music Generation APIs](#1-music-generation-apis)
2. [Image Generation APIs](#2-image-generation-apis)
3. [Audio Streaming Sources](#3-audio-streaming-sources)
4. [CAPTCHA Solutions](#4-captcha-solutions)
5. [Analytics Options](#5-analytics-options)

---

## 1. Music Generation APIs

### Suno AI

**Status:** Research needed
**Website:** https://suno.ai

#### What We Know

- Generates full songs with vocals and instrumentals
- Web-based interface at suno.ai
- Used by many for AI music creation
- Quality is reportedly very good for lofi/ambient

#### API Access

| Question | Status |
|----------|--------|
| Public API available? | Unknown |
| API documentation? | Not found publicly |
| Pricing? | Unknown |
| Rate limits? | Unknown |

#### Next Steps

1. Check if API access requires partnership
2. Look for unofficial API documentation
3. Contact Suno for developer access
4. Evaluate alternatives if not available

#### Alternatives to Research

| Service | Notes |
|---------|-------|
| Mubert | Has API, generates ambient/background music |
| AIVA | Classical/cinematic focus, has API |
| Soundraw | Royalty-free AI music, subscription model |
| Beatoven.ai | Video soundtrack focus |

---

### Mubert

**Status:** Potential alternative
**Website:** https://mubert.com

#### Overview

Mubert generates ambient and background music, potentially suitable for lofi vibes.

#### API Access

- Developer API available
- Documentation: https://api.mubert.com/docs
- Free tier: Limited
- Paid plans: Various

#### Sample Integration

```typescript
// Mubert API example (to be verified)
const response = await fetch('https://api.mubert.com/v2/render', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MUBERT_API_KEY}`,
  },
  body: JSON.stringify({
    license: 'premium',
    mode: 'track',
    duration: 180,  // 3 minutes
    tags: ['lofi', 'chill', 'ambient'],
  }),
});
```

#### Evaluation Criteria

- [ ] Quality matches lofi aesthetic
- [ ] API reliability and latency
- [ ] Cost per generation
- [ ] Licensing terms for generated music
- [ ] Rate limits sufficient for use case

---

## 2. Image Generation APIs

### OpenAI DALL-E 3

**Status:** Selected for implementation
**Documentation:** https://platform.openai.com/docs/guides/images

#### Confirmed Details

| Aspect | Detail |
|--------|--------|
| Model | dall-e-3 |
| Endpoint | /v1/images/generations |
| Sizes | 1024x1024, 1792x1024, 1024x1792 |
| Quality | standard, hd |
| Max per request | 1 (DALL-E 3 limitation) |

#### Pricing (as of 2025)

| Size | Standard | HD |
|------|----------|----|
| 1024x1024 | $0.04 | $0.08 |
| 1792x1024 | $0.08 | $0.12 |

#### Integration Decision

**Selected:** DALL-E 3 for primary image generation

**Reasons:**
- High quality output
- Consistent style adherence
- Reasonable pricing
- Good documentation
- Reliable API

---

### Alternatives Evaluated

#### Midjourney

| Pros | Cons |
|------|------|
| Excellent artistic quality | No public API |
| Strong community | Discord-based only |
| Good for stylized art | Not automatable |

**Decision:** Not suitable due to lack of API

#### Stable Diffusion

| Pros | Cons |
|------|------|
| Open source | Requires hosting |
| Can self-host | Model management complex |
| No per-image cost | Quality varies |

**Decision:** Too much infrastructure overhead for current scope

#### Leonardo.ai

| Pros | Cons |
|------|------|
| API available | Less consistent than DALL-E |
| Affordable | Smaller community |
| Good for specific styles | |

**Decision:** Keep as backup option

---

## 3. Audio Streaming Sources

### Lofi Streaming Options

For the MVP, we need reliable audio streams that don't require AI generation.

#### Option A: Third-Party Streams

| Source | Type | Reliability | Notes |
|--------|------|-------------|-------|
| Lofi Girl | YouTube Live | High | May have API restrictions |
| Chillhop | Various | Medium | Curated playlists |
| SomaFM | Internet Radio | High | Various channels |

**Concerns:**
- Licensing for commercial use
- Stream reliability
- Terms of service compliance

#### Option B: Self-Hosted Curated

Host our own curated playlist:
- License royalty-free lofi tracks
- Store in S3
- Serve via CloudFront
- Full control over content

**Sources for Royalty-Free Lofi:**
- Uppbeat (free with attribution)
- Pixabay Music
- Free Music Archive
- Incompetech

#### Option C: Streaming Service APIs

Some services offer legitimate APIs:
- Spotify (requires auth, SDK)
- SoundCloud (limited API)

**Decision for MVP:** Option B (self-hosted) for reliability and control

---

### Audio Format Research

#### Recommended Format

| Attribute | Value |
|-----------|-------|
| Format | MP3 |
| Bitrate | 128-192 kbps |
| Sample Rate | 44.1 kHz |
| Channels | Stereo |

#### Streaming vs. Progressive Download

For short tracks (< 5 min):
- Progressive download is simpler
- Full track loads, then plays
- Good for S3 + CloudFront

For long/infinite streams:
- HLS (HTTP Live Streaming)
- More complex to set up
- Better for radio-style experience

**Decision:** Start with progressive download for MVP

---

## 4. CAPTCHA Solutions

### Requirements

- Low friction for legitimate users
- Effective against bots
- Privacy-respecting
- Free or low cost

### Options Evaluated

#### Cloudflare Turnstile

| Aspect | Detail |
|--------|--------|
| Cost | Free |
| Privacy | Privacy-focused |
| Friction | Low (invisible option) |
| Documentation | Good |

**Verdict:** Recommended

#### hCaptcha

| Aspect | Detail |
|--------|--------|
| Cost | Free tier available |
| Privacy | Privacy-focused |
| Friction | Medium |
| Documentation | Good |

**Verdict:** Good alternative

#### Google reCAPTCHA

| Aspect | Detail |
|--------|--------|
| Cost | Free |
| Privacy | Google tracking concerns |
| Friction | Variable |
| Documentation | Excellent |

**Verdict:** Avoid due to privacy concerns

### Implementation Notes

#### Turnstile Integration

**Frontend:**
```bash
npm install @marsidev/react-turnstile
```

```tsx
import { Turnstile } from '@marsidev/react-turnstile';

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
  onSuccess={setToken}
  onError={() => setError('CAPTCHA failed')}
/>
```

**Backend:**
```typescript
const verifyTurnstile = async (token: string): Promise<boolean> => {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET,
        response: token,
      }),
    }
  );
  const data = await response.json();
  return data.success;
};
```

---

## 5. Analytics Options

### Requirements

- Privacy-respecting
- No cookie consent needed (if possible)
- Basic metrics (page views, user counts)
- Cost-effective

### Options

#### Plausible Analytics

| Aspect | Detail |
|--------|--------|
| Privacy | No cookies, GDPR compliant |
| Cost | $9/mo or self-host |
| Features | Basic, clean dashboard |

#### Fathom Analytics

| Aspect | Detail |
|--------|--------|
| Privacy | No cookies, GDPR compliant |
| Cost | $14/mo starting |
| Features | Simple, fast |

#### Umami (Self-Hosted)

| Aspect | Detail |
|--------|--------|
| Privacy | Full control |
| Cost | Free (hosting costs) |
| Features | Comprehensive |

#### CloudFront + CloudWatch

| Aspect | Detail |
|--------|--------|
| Privacy | Built-in |
| Cost | Included with AWS |
| Features | Basic access logs |

### Decision

**Short-term:** CloudFront access logs (free, already available)
**Long-term:** Consider Plausible or self-hosted Umami

---

## Research Backlog

Items needing further research:

- [ ] Suno API access process
- [ ] Mubert API quality testing
- [ ] Royalty-free music licensing deep dive
- [ ] HLS streaming setup for long-form audio
- [ ] Web Audio API visualizations
- [ ] Service worker for offline audio caching

---

## Research Log

### 2026-01-17

- Documented known information about APIs
- Identified DALL-E 3 as primary image generation
- Noted Suno API access as unknown
- Recommended Cloudflare Turnstile for CAPTCHA
- Outlined audio streaming options

---

*Last updated: January 2026*

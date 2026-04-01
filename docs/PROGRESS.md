# Project Progress - robmclaughl.in

## Current Status
- Next.js application prototype completed and deployed
- Core UI components implemented with lo-fi theme and responsiveness
- Infrastructure as Code (Terraform) configuration created and successfully applied
- CI/CD pipeline set up with GitHub Actions and operational
- Site is live at `robmclaughl.in`
- Security review completed and improvements implemented

## Completed Tasks

### Frontend Development
- ✅ Created Next.js project with App Router
- ✅ Implemented lo-fi themed design with enhanced UI elements
- ✅ Added responsive layout with mobile optimizations
- ✅ Integrated shadcn/ui components
- ✅ Built custom components (CoffeeCup, Waveform, HeroBackground)
- ✅ Added decorative elements and animations
- ✅ Implemented social links with hover effects

### HeroBackground Component Implementation
- ✅ Created fullscreen background video component
- ✅ Implemented performance optimizations:
  - Used `preload="metadata"` for efficient loading
  - Added Intersection Observer to pause video when off-screen
  - Added support for multiple formats (MP4/WebM)
- ✅ Added visual effects:
  - Semi-transparent overlay
  - Noise texture using inline SVG
  - CRT-style scanlines
  - Subtle hover brightness/contrast effect
- ✅ Ensured responsive behavior with mobile image fallback
- ✅ Added accessibility features:
  - Support for prefers-reduced-motion
  - Proper ARIA attributes
  - Error handling with fallbacks

#### Integration Notes
To use the HeroBackground component, you'll need:

1. An image in `/public/videos/` for video fallback (while proper video is created)
2. Wrap your content within the HeroBackground component
3. Set appropriate overlay color that complements your design

Example usage in page.tsx:
```tsx
<HeroBackground 
  videoSrc="/videos/your-video.mp4" 
  videoWebmSrc="/videos/your-video.webm" // Optional WebM version
  mobileBackgroundImage="/path/to/static-image.jpg"
  overlayColor="rgba(13, 16, 45, 0.5)"
>
  {/* Your page content goes here */}
</HeroBackground>
```

### Infrastructure
- ✅ Terraform configuration for AWS resources
  - S3 bucket for static content (with public access blocked)
  - CloudFront distribution with HTTPS, OAC, security headers, and access logging
  - ACM certificate
  - Route53 DNS records
  - IAM role for GitHub Actions with least privilege permissions
  - S3 backend for Terraform state with DynamoDB locking
- ✅ GitHub Actions workflow for automated deployments using pnpm
- ✅ Added deployment scripts
- ✅ Configured deployment environment variables
- ✅ Successfully deployed to production

### Accessibility Improvements (March 29, 2026)
- ✅ Added skip-to-content link in layout for keyboard navigation
- ✅ Added `id="main-content"` target on the main content area
- ✅ Added `prefers-reduced-motion` media query to disable CRT flicker, text flicker, box flicker animations, and icon-glow hover transforms
- ✅ Added `touch-action: manipulation` on `<html>` to eliminate 300ms tap delay on mobile
- ✅ Added `focus-visible` ring styles to the "Go home" link on the 404 page
- ✅ Marked decorative elements (`Music` icons, `Waveform`) with `aria-hidden="true"`
- ✅ Set explicit `dark` class and `colorScheme: "dark"` on `<html>` for reliable dark mode

### Component Composition Improvements (March 29, 2026)
- ✅ Removed `disableEffects` prop from `HeroBackground` component, simplifying its API
- ✅ Flattened conditional rendering — overlay, noise texture, and inner shadow layers are now always rendered
- ✅ Cleaned up callback dependencies in `handleMouseEnter`/`handleMouseLeave`

### Design & Animation Refinements (March 29, 2026)
- ✅ Reworked neon text effect from `text-shadow` to `filter: drop-shadow()` to avoid conflicts with text-flicker animation
- ✅ Updated glow colors from Tailwind theme references to explicit `rgba(255, 102, 199, ...)` values for consistency
- ✅ Added `will-change: filter` to `.box-flicker` for GPU-optimized rendering
- ✅ Box-flicker animation now pauses on hover so icons are stable when interacted with
- ✅ Added explicit `transition` for `filter` and `transform` on `.icon-glow`
- ✅ Scoped social button transitions to `transition-[color,background-color]` to prevent filter/transform interference
- ✅ Removed redundant `drop-shadow` utilities from the heading and bio section

### Audio Player — Vibe Generator MVP (March 29, 2026)
- ✅ **TASK-006:** Audio infrastructure — `public/audio/playlist.json` created with 7 tracks, `.mp3` files in `public/audio/`
- ✅ **TASK-007:** Core `useAudioPlayer` hook — HTML5 Audio API via `useRef`, playlist fetch, autoplay muted, track advancement, play/pause/mute/volume/next/prev/collapse actions
- ✅ **TASK-008:** Expanded player UI — `PlayerControls` component with 6 controls (play/pause, prev, next, mute, volume slider, collapse), retro neon glow styling, shadcn Button/Slider
- ✅ **TASK-009:** Collapsed player UI — `CollapsedPlayer` music note button with pulse glow when playing
- ✅ **TASK-010:** Mobile responsive — 44px tap targets, volume slider toggled behind tap on mobile, full-width bottom bar on small screens
- ✅ **TASK-011:** Integration — `AudioPlayerLoader` client wrapper with `next/dynamic` `ssr: false`, mounted in `app/layout.tsx`

#### Audio Player Architecture
```
app/layout.tsx
  └─ AudioPlayerLoader (client boundary, dynamic import, ssr: false)
       └─ AudioPlayer (state via useAudioPlayer hook)
            ├─ PlayerControls (expanded UI)
            └─ CollapsedPlayer (minimized icon button)

hooks/use-audio-player.ts — all state + Audio API logic
public/audio/playlist.json — track manifest
public/audio/*.mp3 — 7 lo-fi tracks
```

## In Progress
- Content refinement
- Performance testing
- Additional UI/UX enhancements
- Cross-browser & autoplay testing (TASK-012)
- Visual testing of audio player (positioning, content obstruction, mobile layout)

## Next Steps
- TASK-012: Cross-browser & autoplay testing across Chrome, Safari, Firefox, Edge
- TASK-003: Fix ESLint/TypeScript errors, remove `ignoreDuringBuilds` flags
- TASK-004: Remove duplicate hooks from `components/ui/`
- Add analytics (optional)
- Consider adding blog functionality in future iteration
- Implement light/dark mode toggle

## Project Goals
- Create a minimal, lo-fi themed personal site
- Ensure fully responsive design
- Serve securely over HTTPS
- Build with maintainable, extendable architecture
- Optimize for performance and SEO

## Timeline
- Phase 1 (Current): MVP with core functionality and deployment
- Phase 2 (Future): Content expansion and additional features
- Phase 3 (Future): Advanced interactivity and dynamic content

## Known Issues

### Terraform Backend Deploy Failing (pre-existing)
The `deploy-backend.yml` workflow fails because the **Terraform IAM role** (`GitHubActions-TerraformBackendRole-robmclaughl-in`, stored in `secrets.TERRAFORM_AWS_IAM_ROLE_ARN`, AWS account `964943862554`) is missing CloudFront and WAF permissions. Error: `cloudfront:GetDistribution` denied.

**Impact:** Terraform infrastructure changes cannot be applied via CI. The frontend deploy workflow (`deploy.yml`) is unaffected and works normally.

**Fix:** Add `cloudfront:*` and `wafv2:*` permissions (or attach managed policies `CloudFrontFullAccess` + `AWSWAFFullAccess`) to the `GitHubActions-TerraformBackendRole-robmclaughl-in` role in the AWS IAM console. This role is managed manually, not by Terraform.

### Build Fails Locally on Node.js v22
`pnpm run build` fails with `TypeError: Cannot read properties of undefined (reading 'length')` in Webpack's `WasmHash`. This is a Next.js 15.1.0 / Node.js v22 compatibility issue. CI uses Node 18 and may not hit this. Consider upgrading Next.js or pinning local Node to v18/v20.

## Security Improvements (April 4, 2025)
- ✅ Migrated from CloudFront Origin Access Identity (OAI) to Origin Access Control (OAC)
- ✅ Enabled CloudFront access logging to a dedicated S3 bucket
- ✅ Implemented a Response Headers Policy with security headers:
  - Strict-Transport-Security (HSTS)
  - Content-Security-Policy (CSP)
  - X-Content-Type-Options
  - X-Frame-Options
  - Referrer-Policy
  - X-XSS-Protection
- ✅ Removed unnecessary S3 permissions from the GitHub Actions IAM role
- ✅ Updated GitHub Actions workflow to use pnpm and removed redundant flags
- ✅ Enabled S3 backend for Terraform state with DynamoDB locking

*Last updated: March 30, 2026*

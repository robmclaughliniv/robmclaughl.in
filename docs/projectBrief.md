# Project Brief

## Overview

Figure: The lofi.cafe interface features a retro "lo-fi" aesthetic, inspiring the vibe for Rob's personal site. This online lofi music player is known for its "retro style design", which conveys a chill, nostalgic atmosphere.

Rob McLaughlin's personal site will be a minimal, lo-fi themed web application that showcases his professional profile and personality. The goal is to create a single-page MVP (Minimum Viable Product) tonight that is visually engaging yet extremely simple under the hood.

The design takes inspiration from lofi.cafe's calming, retro aesthetic – think dark themes, subtle neon or CRT-style visuals, and a "chill beats" vibe – while incorporating Rob's personal branding (his name, links to LinkedIn, etc.) in a clean, modern way.

The target audience includes fellow developers, recruiters, and the tech community, so the site should make a strong first impression about Rob's style and skills without overwhelming content.

## Goals & Audience

The site should quickly communicate who Rob is and how to reach him. It's essentially a digital business card with style. A minimalist content approach will list:
- Rob's name
- A brief tagline or title (e.g. "Engineering Manager")
- Icons/links to his LinkedIn, GitHub, email, etc.

This ensures anyone visiting (peers, employers, collaborators) can learn the basics at a glance. The lo-fi visual theme adds personality, making the site memorable and reflective of Rob's interests, while still keeping it professional and accessible.

## Aesthetic Inspiration

Visually, the lo-fi chill theme is key. This means using:
- A dark color palette
- Perhaps a subtle animated background or graphic that evokes a cozy coffee shop or retro computer screen

We take cues from lofi.cafe's design which has a "retro style" and calming animations. In practice, this could mean:
- A background image or color gradient with a slight grainy filter
- Pixelated or neon text for headings
- Simple ambient animations (for example, a slowly pulsating icon)

The typography might use a monospaced or pixel font for a retro touch, combined with modern clean fonts for readability. The layout should be responsive and centered, looking great on mobile (small screens) and scaling up elegantly to desktop. We want the page to feel like a "lofi lounge" on all devices – inviting and cool, but not cluttered.

## MVP Deliverables

By tonight, the deliverable is a fully functional website deployed at https://robmclaughl.in with the following minimal features:

1. A landing page with Rob's name prominently, a short descriptor (e.g. title or one-liner about him), and a section for contact links (icons for LinkedIn, GitHub, etc.). No multi-page navigation is needed in this MVP.
2. The page design reflecting the lo-fi cafe inspiration – dark theme, possibly a background illustration or pattern, and TailwindCSS-powered styling for a modern layout. It should load fast and have no interactive features aside from hyperlink clicks.
3. Responsive design so that it looks good on a phone, tablet, or desktop (the layout might collapse nicely on smaller screens, e.g. stacking elements vertically).
4. Basic analytics or interactivity are not in scope for MVP (keep it simple). Likewise, content is minimal – this is a starting point that can later be expanded with a blog, portfolio, etc.
5. The site should be hosted on Rob's domain with HTTPS, and the infrastructure and code should be clean enough to extend in future phases.

## Rollout Phases

Tonight's effort is Phase 1, focusing on the core personal homepage. Future phases can build on this foundation:

### Phase 1 (Now – MVP)
Launch the single-page personal site with branding and contact info. Achieve a solid aesthetic and a stable deployment pipeline. This phase uses the tech stack described below and sets up all foundational infrastructure (repository, CI/CD, cloud hosting, DNS).

### Phase 2 (Next Iterations)
Add more content and sections once the MVP is live. For example, integrate a blog or articles section, a portfolio of projects, or an "About Me" with more details. Because the MVP is built with Next.js and a robust design system, adding new pages or features (like a music player widget or theme switcher) will be straightforward.

### Phase 3 (Polish & Advanced Features)
Introduce dynamic content or advanced interactivity if needed. This could include a CMS for blog posts, contact forms, or integrating real-time features. Security and performance can be further tightened (analytics, SEO optimizations beyond the basics). The infrastructure set up in Phase 1 (Terraform scripts, CI/CD) will accommodate these changes; we'll mostly be iterating on the front-end and perhaps enabling serverless functions or databases as needed.

Throughout all phases, simplicity and robustness are priorities. The Phase 1 implementation should be clean and maintainable, so Rob can easily jump back in to add features. We prefer to start small and stable, then layer on complexity in controlled steps.
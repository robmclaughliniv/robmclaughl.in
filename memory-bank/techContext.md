# Technical Context

*This document details the technologies used in the project, development environment setup, technical constraints, dependencies, and specific tool usage patterns.*

## Technology Stack

*   **Frontend:** Next.js 13 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui components.
*   **Backend:** N/A (Static site generation for MVP).
*   **Infrastructure:** AWS (S3 for hosting, CloudFront for CDN & HTTPS, Route 53 for DNS, ACM for SSL certificates). Infrastructure as Code managed by Terraform.
*   **CI/CD:** GitHub Actions.
*   **Other Key Technologies:** AWS CLI (for deployment scripts).

## Development Environment Setup

*   **Core Tools:** Node.js, pnpm (inferred from `pnpm-lock.yaml`).
*   **Setup:** Clone repository, run `pnpm install` to install dependencies.
*   **Running Locally:** `pnpm run dev` (standard Next.js command found in `package.json`).
*   **Environment Variables:** Specific variables not detailed yet, but may be needed for future AWS integration or API keys.

## Technical Constraints

*   **MVP Focus:** Initial build is a minimal single-page application.
*   **Performance:** Must load quickly (leveraging static generation and CDN).
*   **Responsiveness:** Must work well across mobile, tablet, and desktop.
*   **Security:** Must use HTTPS, secure S3 bucket configuration (OAC), secure CI/CD (OIDC), security headers via CloudFront Response Headers Policy, and access logging. Avoid revealing implementation details (e.g., disable `x-powered-by` header).
*   **Timeline:** Initial MVP targeted for rapid completion ("tonight").

## Key Dependencies

*   **Framework:** Next.js (`^15.1.0`)
*   **UI Library:** React (`^18.2.0`)
*   **Styling:** Tailwind CSS (`^3.4.17`), class-variance-authority, clsx, tailwind-merge, tailwindcss-animate.
*   **Components:** Numerous `@radix-ui/*` and `shadcn/ui` components (see `package.json` for full list, e.g., `lucide-react` for icons).
*   **Infrastructure:** AWS Services (S3, CloudFront, Route53, ACM).
*   **Deployment:** GitHub Actions, Terraform.

## Tool Usage & Conventions

*   **Version Control:** Git, hosted on GitHub. Deployment triggered from the `main` branch. Specific branching strategy not defined yet.
*   **Package Manager:** `pnpm`. Use `pnpm install`, `pnpm run dev`, `pnpm run build`.
*   **Linters/Formatters:** TypeScript is used. Assumed standard tools like ESLint/Prettier are configured (typical for Next.js starter). Config files: `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`.
*   **Testing:** Not implemented in MVP.
*   **Build Process:** `pnpm run build` (uses `next build`). Likely generates static assets for deployment.
*   **Deployment:** Automated via GitHub Actions workflow (`.github/workflows/deploy.yml`). Uses OIDC for secure AWS authentication. Builds the site using pnpm, syncs static files to S3, invalidates CloudFront cache. Infrastructure defined in Terraform (`terraform/` directory) with state stored in S3 backend.

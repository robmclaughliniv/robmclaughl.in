# Technical Overview

## Tech Stack & Architecture

The project is built with Next.js 13 (using the App Router architecture) and TypeScript. Next.js is a React framework that enables hybrid static and server rendering, route-based code splitting, and many production optimizations out of the box.

We choose Next.js for its flexibility and excellent SEO support – pages can be pre-rendered on the server, meaning the delivered HTML is crawlable and fast, rather than a blank page that requires heavy client-side rendering. In fact, Next.js's Server-Side Rendering (SSR) and Static Generation approaches mean the site's HTML is pre-rendered (either at build-time or request-time), which is great for performance and SEO.

With this setup, search engines and social previews will easily read Rob's site information. We'll likely use static generation for the MVP (since content is mostly static), yielding an ultra-fast site delivered via CDN. Next.js will automatically prerender pages to static HTML when possible, and we will ensure our implementation takes advantage of that for speed.

The App Router allows organizing the app into React Server Components and layouts, but for this simple site we'll mostly have a single page.tsx with perhaps a layout wrapper.

The UI is styled using Tailwind CSS, a utility-first CSS framework. Tailwind lets us rapidly build custom designs by composing small, reusable utility classes (for margin, padding, color, etc.) directly in the HTML. This means we can achieve the desired look (custom spacing, fonts, colors) without writing a lot of custom CSS. It's perfect for a fast iteration tonight, since we can adjust styles just by changing class names. We'll configure Tailwind in JIT mode so only the classes we use end up in the CSS (keeping the bundle tiny).

The design system is augmented with shadcn/ui, which provides a set of pre-built, accessible React components styled with Tailwind. Shadcn/ui will give us ready-made building blocks (like buttons, dialogs, navigation menus, etc.) that match Tailwind's styling paradigm, so we don't have to build everything from scratch. Essentially, it's a library of "beautifully-designed, accessible components" we can copy into our project.

For this MVP, we might use a shadcn button or icon component for consistency, but keep the overall UI lightweight. All styling will be responsive (Tailwind makes mobile-first design easy by simply adding responsive prefixes to classes, e.g. `md:text-xl` for larger text on medium screens). We'll also ensure the layout uses semantic HTML elements (header, main, footer) to improve accessibility and maintainability.

## Infrastructure & Deployment

We are deploying on AWS for full control and scalability. The static site assets will be served from Amazon S3 and CloudFront.

The plan is to build the Next.js site and export it as static files, then host those files on an S3 bucket (configured for web hosting). To ensure global low-latency access and HTTPS, we'll put Amazon CloudFront (a CDN) in front of the S3 bucket. CloudFront will cache the content at edge locations worldwide and handle SSL termination.

This also allows us to keep the S3 bucket private and secure – we'll use an Origin Access Control (OAC) or similar mechanism so that CloudFront can fetch from S3, but the bucket isn't publicly accessible. (This is a security best practice: "If you want to keep S3 Block Public Access enabled and host a static website, you can use Amazon CloudFront origin access control (OAC). CloudFront provides the capabilities required to set up a secure static website... providing additional security headers, such as HTTPS.")

The custom domain robmclaughl.in will be managed via Amazon Route 53 (AWS's DNS service). We'll create a hosted zone for the domain and use an A Record (alias) to point the root domain to the CloudFront distribution – this ties the domain to our CloudFront endpoint seamlessly. An AWS Certificate Manager (ACM) SSL certificate will be issued for the domain and attached to CloudFront, so that the site is served over HTTPS with a valid certificate (no browser warnings).

We are aiming for Infrastructure as Code, so all AWS resources (S3 bucket, CloudFront distribution, DNS records, etc.) will be defined in code using Terraform. Terraform is a tool that lets you define cloud infrastructure in human-readable configuration files, then deploy those resources consistently.

By writing Terraform configs, we ensure the setup is reproducible and version-controlled. For example, we'll write Terraform to create the S3 bucket (with the proper policies), the CloudFront distro (with origin pointing to that bucket, enabling OAC and compressions, etc.), and the Route53 DNS records. This approach avoids manual clicking in the AWS console and makes it easier to tear down or modify resources. (Terraform's declarative nature means we just describe what we want – e.g., "an S3 bucket named X" – and it takes care of the AWS API calls to make it so.)

If time is very short, we might use a quicker route like the AWS Amplify console or even deploy on Vercel as a stop-gap, but the preferred path is S3/CloudFront via Terraform for full control. We'll keep the Terraform config minimal (just what's needed for this site) but structured for future growth (e.g., easy to add a CDN invalidation or a new Lambda function later if needed).

## CI/CD Pipeline

For continuous integration and deployment, GitHub Actions will be used. GitHub Actions allows us to automate building and deploying the site whenever we push new changes to the repository.

We'll set up a workflow such that any push or merge to the main branch triggers a job to build the Next.js project and sync the output to S3, then invalidate CloudFront cache. In practice, the CI script will:

1. Checkout the code
2. Install dependencies
3. Run the Next.js build (and possibly next export to generate static files)
4. Use AWS CLI or an action to upload the files to S3
5. Issue a CloudFront cache invalidation so the new content goes live immediately

The entire pipeline runs automatically, meaning Rob can just git push to deploy new updates after tonight.

To make this pipeline secure, we will avoid storing long-lived AWS credentials in GitHub. Instead, we'll use GitHub's OIDC integration with AWS: configure AWS to trust GitHub Actions as an identity provider so that the workflow can assume a specific IAM role.

This way, the GitHub runner will get temporary credentials to deploy, and we don't need to put AWS keys in the repo. The IAM role will have least privilege, e.g. permission only to upload to the specific S3 bucket and invalidate the specific CloudFront distribution (and perhaps to update Route53 if we automate that). This setup (OIDC and limited IAM roles) is aligned with security best practices – no hard-coded secrets, and minimal access scope.

## Production Readiness & Security

Even though this is an MVP, we'll apply a few basic security best practices from the start:

- We'll disable any framework banners or unnecessary headers – for example, Next.js by default adds an `x-powered-by: Next.js` header to responses; we will turn that off in next.config.js to avoid revealing implementation details.
- The site will enforce HTTPS (HTTP requests will be redirected to HTTPS by CloudFront).
- We will configure appropriate MIME types and caching for static assets via CloudFront.

The content itself is simple, so attack surface is minimal (no forms or SQL, etc.), but we will ensure no obvious vulnerabilities:
- Use latest dependencies
- Include a Content Security Policy if we had external scripts (not needed for this static MVP)
- Ensure cookies (if any in future) are secure and same-site

The AWS resources will be locked down:
- The S3 bucket won't be public, and will be encrypted at rest (S3 enables SSE by default now).
- Route53 will only point to our CloudFront, and CloudFront will have an TLS cert so data in transit is encrypted.
- We'll log requests (CloudFront can log access, which we can review later).

Finally, performance is a facet of "production-ready" for us – the site should be very fast. Using Next.js and S3+CloudFront gives us inherently good performance (pre-rendered HTML served from a CDN). We will optimize images or media if any (though likely the MVP has no large media aside from maybe a background). Tailwind will purge unused CSS, so the CSS file will be tiny. The result should be a site that loads almost instantly and scores well on performance metrics.

Despite the accelerated timeline, the combination of this tech stack ensures we aren't cutting corners on quality. SSR/SSG Next.js provides SEO-friendly content and speed, TailwindCSS and shadcn/ui give us rapid styling capability with consistency, Terraform and AWS give a stable, DevOps-approved hosting setup, and GitHub Actions CI/CD means updates are low-friction. The codebase and infrastructure will be lean, focusing only on what's necessary to get live, which will make it easy to maintain and extend in the future.
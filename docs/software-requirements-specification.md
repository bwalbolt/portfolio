```md
# Software Requirements Specification (SRS) – Personal Portfolio Site

## System Design
- Static-site portfolio with dynamic content rendering for blog, tutorials, and case studies.
- Interactive homepage with animations and transitions.
- Content-driven architecture (case studies, blog posts, tutorials).
- Contact form with email delivery backend.
- Blog posts and tutorials written in Markdown.
- Tutorials are a category/type of blog post, not a separate content system.
- Fully responsive mobile-first design.
- Accessibility-first implementation (WCAG 2.2 AA).
- Optimized for performance, SEO, and 100 Lighthouse scores.
- Analytics integrated across all pages.

---

## Architecture pattern
- Jamstack architecture.
- Static site generation for pages and blog content.
- Component-based frontend architecture.
- Separation of:
  - Presentation layer (UI components)
  - Content layer (Markdown content)
  - Services layer (contact form API, analytics)
- Page transitions and animations handled on frontend.
- Deployment via CDN hosting.

---

## State management
- Minimal global state required.
- Local component state for:
  - Navigation menu
  - Animations
  - Form state
  - Blog filters/tags
- Global state may include:
  - Theme (light/dark)
  - Reduced motion preference
  - Page transition state
- Recommended approaches:
  - React Context or lightweight state store
  - URL query params for filters and blog categories

---

## Data flow
1. Blog posts written in Markdown.
2. Static build process converts Markdown into pages.
3. Static site deployed to CDN.
4. User navigates routes and pages load with transitions.
5. Blog filtering handled client-side.
6. Contact form submits to serverless API endpoint.
7. Analytics tracks page views and interactions.

Flow summary:
- Markdown → Static build → CDN → User → API (contact) → Analytics

---

## Technical Stack
**Frontend**
- Next.js (Static Site Generation)
- React
- TypeScript
- Vanilla CSS
- Animation library (Framer Motion or GSAP)
- Markdown rendering (MDX or Markdown parser)
- Syntax highlighting for code blocks

**Backend / Services**
- Serverless functions for contact form
- Email service (Resend, SendGrid, etc.)
- Analytics - Google Analytics

**Hosting**
- Vercel / Netlify / Cloudflare Pages
- CDN for assets

**Performance goals**
- Lighthouse 100 scores
- Static generation
- Image optimization
- Code splitting
- Lazy loading images and animations

---

## Authentication Process
- No authentication required.
- Blog posts managed via Markdown files in the repository.
- Site is fully public.
- Admin/CMS login not required.

---

## Route Design
**Primary Routes**
- `/` – Homepage
- `/case-studies`
- `/case-studies/[slug]`
- `/blog`
- `/blog/[slug]`
- `/tutorial` – Filtered blog posts tagged as tutorials
- `/about`
- `/contact`

**Notes**
- Tutorials are blog posts with a "tutorial" tag.
- `/tutorial` route filters blog posts by tutorial tag.

---

## API Design
**Contact Form API**
- `POST /api/contact`
  - name
  - email
  - message

**Analytics**
- Page views
- Blog post views
- Case study views
- Contact form submissions
- External link clicks (GitHub, LinkedIn)

Serverless functions recommended.

---

## Database Design ERD
(No traditional database required if using Markdown content)

**Content Entities (Markdown-based)**

### BlogPost
- title
- slug
- content
- tags
- date
- description
- coverImage
- type (blog | tutorial)

### CaseStudy
- title
- slug
- overview
- problem
- process
- solution
- results
- techStack
- images

### ContactSubmission (stored via email service or database)
- name
- email
- message
- date

**Relationships**
- BlogPost → many Tags
- CaseStudy → many Images
- Tutorials are BlogPosts with tag/type = tutorial


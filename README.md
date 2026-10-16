# Portfolio

My personal portfolio site which serves as a professional display of recent work, blog, and tutorial hub. With most of my recent work being proprietary, and everything else being outdated, it is time to start fresh. Code available here for anyone interested in reviewing or wanting to learn from it.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, SSG)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: Vanilla CSS
- **Animations**: CSS, Framer Motion, GSAP
- **Content**: Markdown-driven Blog & Case Studies
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (Latest LTS)
- npm / pnpm / yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view the project in your browser.

## Contact form configuration

The homepage contact form sends mail through Resend from a Vercel Route Handler. Add
these values to `.env.local` for local development and to the Vercel project for both
Production and protected Preview deployments:

```bash
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=your-inbox@example.com
CONTACT_FROM_EMAIL="Portfolio <contact@brent.walbolt.com>"
```

`CONTACT_FROM_EMAIL` must use a sender verified in Resend. Keep `RESEND_API_KEY`
private: do not prefix it with `NEXT_PUBLIC_` or commit any `.env` file. Before launch,
configure Vercel Firewall to allow three `/api/contact` requests per IP every ten
minutes, then temporarily block requests that exceed that limit.

To launch at `brent.walbolt.com`, add that hostname and `www.brent.walbolt.com` to the
Vercel project, choose the former as canonical, and add the exact CNAME records Vercel
displays in Namecheap. Add Resend's supplied DNS authentication records for the sending
domain separately.

## 📖 In-Depth Documentation

For detailed insights into the project's architecture and design decisions, refer to the `/docs/` directory:

- [Product Requirements](file:///docs/product-requirements-document.md)
- [Software Requirements](file:///docs/software-requirements-specification.md)
- [User Interface Design](file:///docs/user-interface-design-document.md)

import type { StaticImageData } from "next/image";

import caseStudyDominoDesktop from "../../../../public/images/cs-domino-thumbnail.png";
import caseStudyDominoMobile from "../../../../public/images/cs-domino-thumbnail-mobile.png";
import caseStudyPortfolioDesktop from "../../../../public/images/cs-portfolio-thumbnail.png";
import caseStudyPortfolioMobile from "../../../../public/images/cs-portfolio-thumbnail-mobile.png";
import portraitBrent from "../../../../public/images/portrait-brent.png";
import quoteChrista from "../../../../public/images/quote-christa.jpg";

export type NavigationItem = {
  href: string;
  label: string;
};

export type SocialLink = {
  href: string;
  label: string;
  external: boolean;
};

export type InsightCard = {
  date: string;
  description: string;
  href: string;
  slug: string;
  title: string;
  visibleOnMobile: boolean;
};

export type AccentTone = "blue" | "orange" | "pink" | "purple";

export type CaseStudyCard = {
  artworkDesktop: StaticImageData;
  artworkMobile: StaticImageData;
  description: string;
  href: string;
  layout: "domino" | "portfolio";
  tags: readonly {
    label: string;
    tone: AccentTone;
  }[];
  title: string;
};

export type SkillCard = {
  description: string;
  title: string;
  tone: AccentTone;
};

export const SITE_NAME = "Brent Walbolt";
export const SITE_TAGLINE = "Crafting performant, user-centered designs";
export const COPYRIGHT_LABEL = "© 2026 Brent Walbolt. All rights reserved.";
export const CONTACT_SECTION_HREF = "/#contact";

export const NAV_ITEMS: readonly NavigationItem[] = [
  { href: "/case-studies", label: "Case Studies" },
  { href: "/blog", label: "Blog" },
  { href: "/tutorial", label: "Tutorials" },
  { href: "/about", label: "About" },
] as const;

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { href: "https://www.linkedin.com/in/brent-walbolt/", label: "LinkedIn", external: true },
  { href: "https://x.com/brentwal23", label: "Twitter", external: true },
  { href: "https://github.com/bwalbolt", label: "GitHub", external: true },
] as const;

export const INSIGHTS: readonly InsightCard[] = [
  {
    date: "APR 06, 2026 // 003",
    description: "Most frontend devs agree on one-side margin, but which side?",
    href: "/blog/margin-top-for-the-win",
    slug: "margin-top-for-the-win",
    title: "Margin-top For the Win",
    visibleOnMobile: true,
  },
  {
    date: "APR 05, 2026 // 002",
    description: "How practical can a 2015 MacBook Air be for full-stack work?",
    href: "/blog/working-on-old-hardware",
    slug: "working-on-old-hardware",
    title: "Working on Old Hardware",
    visibleOnMobile: true,
  },
  {
    date: "APR 04, 2026 // 001",
    description:
      "It's been a while since I had a site live. It's time to start fresh.",
    href: "/blog/hello-world",
    slug: "hello-world",
    title: "Hello World",
    visibleOnMobile: false,
  },
] as const;

export const CASE_STUDIES: readonly CaseStudyCard[] = [
  {
    artworkDesktop: caseStudyDominoDesktop,
    artworkMobile: caseStudyDominoMobile,
    description:
      "To learn React Native, I created a functional, cross-platform Domino game for my friends.",
    href: "/case-studies/domino-game",
    layout: "domino",
    tags: [
      { label: "Frontend", tone: "orange" },
      { label: "Design", tone: "pink" },
      { label: "Accessibility", tone: "blue" },
    ],
    title: "React Native: Domino Game",
  },
  {
    artworkDesktop: caseStudyPortfolioDesktop,
    artworkMobile: caseStudyPortfolioMobile,
    description:
      "This site was created to be a showcase of my recent work and a place to share my thoughts.",
    href: "/case-studies/portfolio-site",
    layout: "portfolio",
    tags: [
      { label: "Frontend", tone: "orange" },
      { label: "Design", tone: "pink" },
      { label: "Accessibility", tone: "blue" },
    ],
    title: "My Portfolio Site",
  },
] as const;

export const ABOUT_PARAGRAPHS: readonly string[] = [
  "Senior Design Engineer with 17+ years of experience designing and building accessible, high-quality front-end experiences.",
  "Expert at translating client and stakeholder goals into intuitive, user-centered interfaces through empathy, design judgment, and hands-on engineering. Extensive experience collaborating directly with clients, project managers, and software engineers to ship scalable UI using modern web technologies.",
] as const;

export const SKILLS: readonly SkillCard[] = [
  {
    description:
      "HTML, CSS, JavaScript, TypeScript, React, Component-based architectures, WordPress",
    title: "Frontend Engineering",
    tone: "orange",
  },
  {
    description:
      "UI/UX and interaction design, Prototyping and exploration in code, Design systems",
    title: "Design & UX",
    tone: "pink",
  },
  {
    description:
      "WCAG compliance, Semantic HTML, Performance and SEO, Visual and interaction craft",
    title: "Accessibility & Quality",
    tone: "blue",
  },
] as const;

export const TESTIMONIAL = {
  attribution: "Christa Garcia",
  href: "https://www.linkedin.com/in/brent-walbolt/details/recommendations/",
  image: quoteChrista,
  quote:
    "He’s instinctively collaborative, has great EQ, and is genuinely invested in the success of the people around him.",
  source: "LinkedIn Recommendation",
} as const;

export const AVAILABILITY = {
  eyebrow: "Currently Available",
  message: "Currently seeking innovative collaborations for Q3 2026",
} as const;

export const CONTACT_COPY = {
  emailLabel: "Email",
  emailPlaceholder: "Email address...",
  heading: "Contact Me",
  messageLabel: "Message",
  messagePlaceholder: "Tell me about your project...",
  nameLabel: "Name",
  namePlaceholder: "Full Name...",
  staticNote: "Static preview only. Form submission is not wired yet.",
  submitLabel: "Get in Touch",
} as const;

export const PORTRAIT = {
  alt: "Portrait of Brent Walbolt",
  image: portraitBrent,
} as const;

export const SITE_URL = new URL("https://brent.walbolt.com");
export const SITE_AUTHOR = "Brent Walbolt";
export const SITE_TAGLINE =
  "Hand-crafted interfaces, accessibility, performance, and AI-accelerated workflows.";

export const DEFAULT_SOCIAL_IMAGE = {
  alt: `${SITE_AUTHOR} — ${SITE_TAGLINE}`,
  src: "/images/social-card.png",
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

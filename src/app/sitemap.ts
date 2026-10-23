import type { MetadataRoute } from "next";

import { getPosts } from "./(marketing)/_content/posts";
import { absoluteUrl } from "./site-config";

const STATIC_ROUTES = ["/", "/blog", "/tutorial", "/case-studies", "/privacy-policy", "/terms-of-use"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((path) => ({ url: absoluteUrl(path) })),
    ...getPosts().map((post) => ({
      url: absoluteUrl(post.href),
      lastModified: post.publishedAt,
    })),
  ];
}

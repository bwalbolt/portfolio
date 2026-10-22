import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  // Post metadata owns the document h1; keep the authored title for MDX portability without duplicating it.
  h1: () => null,
};

export function useMDXComponents(): MDXComponents {
  return components;
}

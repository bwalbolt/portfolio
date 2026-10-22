import type { ReactNode } from "react";

type ResponsiveTextProps = {
  children: ReactNode;
};

/**
 * A content-only reading scale. Long-form routes can opt in without inheriting
 * any blog-specific layout or chrome.
 */
export function ResponsiveText({ children }: ResponsiveTextProps) {
  return <div className="responsive-text">{children}</div>;
}

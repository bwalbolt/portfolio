import type { ReactNode } from "react";

import { ArticleOriginProvider } from "./_components/article-origin";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <ArticleOriginProvider>{children}</ArticleOriginProvider>;
}

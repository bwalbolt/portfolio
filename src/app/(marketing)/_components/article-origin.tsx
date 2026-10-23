"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

export type ArticleOrigin = "blog" | "tutorial";

type ArticleOriginContextValue = {
  articleOrigin: ArticleOrigin;
  setArticleOrigin: (origin: ArticleOrigin) => void;
};

const defaultContext: ArticleOriginContextValue = {
  articleOrigin: "blog",
  setArticleOrigin: () => undefined,
};

const ArticleOriginContext = createContext<ArticleOriginContextValue>(defaultContext);

function getQueryOrigin(from: string | null): ArticleOrigin | undefined {
  return from === "tutorial" ? "tutorial" : undefined;
}

const subscribeToNothing = () => () => undefined;

function readQueryOrigin() {
  if (typeof window === "undefined") return undefined;
  return getQueryOrigin(new URLSearchParams(window.location.search).get("from"));
}

/** Reads a shareable origin hint without making statically generated pages suspend. */
export function useArticleOriginHint() {
  return useSyncExternalStore(subscribeToNothing, readQueryOrigin, () => undefined);
}

/**
 * Keeps article-entry context in the small client shell while post content and
 * its route generation remain static Server Components.
 */
export function ArticleOriginProvider({ children }: { children: ReactNode }) {
  const [storedOrigin, setStoredOrigin] = useState<ArticleOrigin>("blog");

  const value = useMemo<ArticleOriginContextValue>(() => ({
    articleOrigin: storedOrigin,
    setArticleOrigin: setStoredOrigin,
  }), [storedOrigin]);

  return (
    <ArticleOriginContext.Provider value={value}>
      {children}
    </ArticleOriginContext.Provider>
  );
}

export function useArticleOrigin() {
  return useContext(ArticleOriginContext);
}

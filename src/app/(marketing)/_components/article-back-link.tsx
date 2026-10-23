"use client";

import Link from "next/link";

import { useArticleOrigin, useArticleOriginHint } from "./article-origin";
import styles from "./blog-post.module.css";

export function ArticleBackLink() {
  const { articleOrigin } = useArticleOrigin();
  const queryOrigin = useArticleOriginHint();
  const isTutorial = (queryOrigin ?? articleOrigin) === "tutorial";
  const destination = isTutorial ? "/tutorial" : "/blog";
  const label = isTutorial ? "Tutorials" : "Blog";

  return (
    <Link className={styles.backLink} href={destination}>
      &lt; Back to {label}
    </Link>
  );
}

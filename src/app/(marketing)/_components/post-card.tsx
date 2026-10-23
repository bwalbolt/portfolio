import type { Post } from "../_content/posts";
import type { ArticleOrigin } from "./article-origin";
import { LinkedPanelCard } from "./linked-panel-card";
import styles from "./post-listing.module.css";

type PostCardProps = {
  articleOrigin: ArticleOrigin;
  post: Post;
};

/** A single linked article preview used by the blog and tutorial route grids. */
export function PostCard({ articleOrigin, post }: PostCardProps) {
  return (
    <LinkedPanelCard
      className={styles.card}
      articleOrigin={articleOrigin}
      href={post.href}
      linkClassName={styles.readMore}
      linkLabel={`Read more about ${post.title}`}
    >
      <div className={styles.headingGroup}>
        <p className={styles.metadata}>{post.dateLabel}</p>
        <h2 className={styles.title}>{post.title}</h2>
      </div>
      <p className={styles.description}>{post.description}</p>
    </LinkedPanelCard>
  );
}

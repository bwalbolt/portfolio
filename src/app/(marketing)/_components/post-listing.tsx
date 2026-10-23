import type { Post } from "../_content/posts";
import type { ArticleOrigin } from "./article-origin";
import { PostCard } from "./post-card";
import styles from "./post-listing.module.css";

type PostListingProps = {
  articleOrigin: ArticleOrigin;
  posts: readonly Post[];
};

/** The reusable grid primitive; each route owns its heading and page composition. */
export function PostListing({ articleOrigin, posts }: PostListingProps) {
  return (
    <ul className={styles.grid}>
      {posts.map((post) => (
        <li key={post.slug}>
          <PostCard articleOrigin={articleOrigin} post={post} />
        </li>
      ))}
    </ul>
  );
}

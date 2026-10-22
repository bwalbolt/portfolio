import type { Post } from "../_content/posts";
import { PostCard } from "./post-card";
import styles from "./post-listing.module.css";

type PostListingProps = {
  posts: readonly Post[];
};

/** The reusable grid primitive; each route owns its heading and page composition. */
export function PostListing({ posts }: PostListingProps) {
  return (
    <ul className={styles.grid}>
      {posts.map((post) => (
        <li key={post.slug}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}

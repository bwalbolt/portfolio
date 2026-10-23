import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const isVerificationBuild = process.env.PORTFOLIO_VERIFY_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isVerificationBuild ? { distDir: ".next-verify" } : {}),
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactCompiler: true,
};

const withMDX = createMDX({
  options: {
    // Turbopack requires plugin names instead of function references.
    remarkPlugins: ["remark-frontmatter"],
  },
});

export default withMDX(nextConfig);

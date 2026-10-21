import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const isVerificationBuild = process.env.PORTFOLIO_VERIFY_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isVerificationBuild ? { distDir: ".next-verify" } : {}),
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactCompiler: true,
};

const withMDX = createMDX();

export default withMDX(nextConfig);

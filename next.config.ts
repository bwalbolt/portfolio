import type { NextConfig } from "next";

const isVerificationBuild = process.env.PORTFOLIO_VERIFY_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isVerificationBuild ? { distDir: ".next-verify" } : {}),
  reactCompiler: true,
};

export default nextConfig;

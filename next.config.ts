import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const harnessRunId = process.env.PORTFOLIO_HARNESS_RUN_ID;
const harnessDistDir = process.env.PORTFOLIO_HARNESS_DIST_DIR;
const harnessTsconfig = process.env.PORTFOLIO_HARNESS_TSCONFIG;
const harnessMode = process.env.PORTFOLIO_HARNESS_SERVER_MODE;
const hasHarnessConfiguration = Boolean(
  harnessRunId || harnessDistDir || harnessTsconfig || harnessMode,
);

if (hasHarnessConfiguration) {
  const expectedDistDir = `.next-harness/${harnessRunId}/output`;
  const expectedTsconfig = `.next-harness/${harnessRunId}/tsconfig.json`;

  if (
    !harnessRunId ||
    !/^(dev|production)-\d+-[0-9a-f-]{36}$/.test(harnessRunId) ||
    harnessDistDir !== expectedDistDir ||
    harnessTsconfig !== expectedTsconfig ||
    !["dev", "production"].includes(harnessMode ?? "") ||
    !harnessRunId.startsWith(`${harnessMode}-`)
  ) {
    throw new Error("Invalid internal harness runtime configuration");
  }
}

const nextConfig: NextConfig = {
  ...(hasHarnessConfiguration
    ? {
        distDir: harnessDistDir!,
        typescript: { tsconfigPath: harnessTsconfig! },
      }
    : {}),
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

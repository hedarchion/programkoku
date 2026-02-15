import type { NextConfig } from "next";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const forceServerMode = process.env.NEXT_FORCE_SERVER === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";
const repoBasePath = isGitHubActions && repoName ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  ...(forceServerMode ? {} : { output: "export" }),
  ...(repoBasePath
    ? {
        basePath: repoBasePath,
        assetPrefix: `${repoBasePath}/`,
      }
    : {}),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

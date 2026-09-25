import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Support standalone output for Render / Docker deployments
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
  eslint: {
    // We run lint in CI pipeline
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Typecheck is run explicitly in CI
    ignoreBuildErrors: false,
  },
  async rewrites() {
    const rewritesList = [
      {
        source: "/favicon.ico",
        destination: "/icon.svg",
      },
    ];

    // When frontend is on Vercel and backend is on Render:
    // Proxy all /api calls to the Render backend URL seamlessly
    const backendUrl = process.env.RENDER_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      const cleanBackend = backendUrl.replace(/\/+$/, "");
      rewritesList.push({
        source: "/api/:path*",
        destination: `${cleanBackend}/api/:path*`,
      });
    }

    return rewritesList;
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone uniquement hors Vercel (Docker/local). Sur Vercel, output standalone + Next 16.3 casse le build (nft.json).
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "21.0.19.129"],
};

export default nextConfig;

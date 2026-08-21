import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel gère le déploiement nativement — pas de output: "standalone" */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "21.0.19.129"],
};

export default nextConfig;

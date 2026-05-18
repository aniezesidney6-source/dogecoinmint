import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['convex'],
  experimental: {
    serverComponentsExternalPackages: ['convex']
  }
};

export default nextConfig;

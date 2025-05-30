import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", "http://0.0.0.0:3000"],
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;

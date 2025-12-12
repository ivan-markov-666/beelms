import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/wiki/media/:path*",
        destination: "http://localhost:3000/wiki/media/:path*",
      },
    ];
  },
};

export default nextConfig;

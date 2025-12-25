import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  distDir: "dist",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Cloudflare Pages deployment via @cloudflare/next-on-pages
  // API routes use runtime = "nodejs" so they work with Firebase Admin SDK patterns
  experimental: {
    // Suppress the jsx prop warning from styled-jsx used in dashboard
  },
};

export default nextConfig;

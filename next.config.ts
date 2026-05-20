import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow Server Actions when the request is proxied through GitHub Codespaces
    // (or any tunnel where x-forwarded-host != origin). Without this, Next.js 15
    // rejects the POST with "Invalid Server Actions request."
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.app.github.dev"],
    },
  },
};

export default nextConfig;

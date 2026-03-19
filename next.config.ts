import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Disable all static generation — everything is dynamic
  // This prevents Vercel from caching any page or API route
  async headers() {
    return [
      {
        // Apply to ALL routes
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

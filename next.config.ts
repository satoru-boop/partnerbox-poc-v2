// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    forceSwcTransforms: true,
  },
  generateBuildId: async () => String(Date.now()),
  async redirects() {
    return [
      // /investor/:id → /investors/:id を恒久リダイレクト
      { source: '/investor/:id', destination: '/investors/:id', permanent: true },
    ];
  },
};

export default nextConfig;

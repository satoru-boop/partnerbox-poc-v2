// next.config.ts
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
    ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname), // ルート直下を '@' に割当て
    };
    return config;
  },
};

export default nextConfig;

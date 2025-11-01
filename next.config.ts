// next.config.ts
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    // 念のため存在ガード
    // @ts-expect-error — Next.jsの型が狭い場合に備えて
    config.resolve = config.resolve || {};
    // @ts-expect-error
    config.resolve.alias = {
      // @ts-expect-error
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname), // ルート直下を '@' に割当て
    };
    return config;
  },
};

export default nextConfig;

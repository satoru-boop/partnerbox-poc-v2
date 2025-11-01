// next.config.ts
import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config: WebpackConfig) => {
    // 念のため存在ガード
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname), // ルート直下を '@' に割当て
    };
    return config;
  },
};

export default nextConfig;

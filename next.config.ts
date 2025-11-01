// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // SWC 変換を強制（古い生成物を避けるための保険）
    forceSwcTransforms: true,
  },
  // 毎回一意の Build ID を生成して、Vercel 側のルートキャッシュを確実に無効化
  generateBuildId: async () => String(Date.now()),
};

export default nextConfig;

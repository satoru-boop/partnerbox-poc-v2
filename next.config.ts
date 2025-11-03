// next.config.ts
const nextConfig = {
  async redirects() {
    return [
      { source: '/submit', destination: '/founder', permanent: false },
    ];
  },
};
export default nextConfig;

import type { NextConfig } from 'next';

const API_URL = process.env.API_URL ?? 'http://localhost:3002';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@sto/ui'],
  async rewrites() {
    return [{ source: '/uploads/:path*', destination: `${API_URL}/uploads/:path*` }];
  },
};

export default nextConfig;

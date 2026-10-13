import type { NextConfig } from 'next';

const API_URL = process.env.API_URL ?? 'http://localhost:3002';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@sto/ui'],
  // Доступ к dev-серверу с других устройств локальной сети (HMR/ассеты).
  allowedDevOrigins: ['192.168.0.*'],
  async rewrites() {
    return [{ source: '/uploads/:path*', destination: `${API_URL}/uploads/:path*` }];
  },
};

export default nextConfig;

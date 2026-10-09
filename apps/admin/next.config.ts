import type { NextConfig } from 'next';

const API_URL = process.env.API_URL ?? 'http://localhost:3002';
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: `${API_URL}/uploads/:path*` },
      { source: '/services/photos/:path*', destination: `${WEB_URL}/services/:path*` },
    ];
  },
};

export default nextConfig;

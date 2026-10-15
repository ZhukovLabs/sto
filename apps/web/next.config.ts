import type { NextConfig } from 'next';

const API_URL = process.env.API_URL ?? 'http://localhost:3002';

/** Базовые security-заголовки. HSTS браузеры применяют только поверх HTTPS — в dev безвреден. */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: true,
  transpilePackages: ['@sto/ui'],
  // Лишний след сервера в ответах нам не нужен.
  poweredByHeader: false,
  images: {
    // AVIF ~30% меньше WebP; отдаётся браузерам, которые его знают.
    formats: ['image/avif', 'image/webp'],
    // Оптимизированные варианты закэшированы по URL с именем файла:
    // источник обновляется только сменой имени (workshop-v3 → v4), так что TTL длинный безопасен.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Локальная сеть в dev-режиме: HMR/ассеты с телефонов и соседних машин.
  allowedDevOrigins: ['192.168.0.*'],
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  async rewrites() {
    return [{ source: '/uploads/:path*', destination: `${API_URL}/uploads/:path*` }];
  },
};

export default nextConfig;

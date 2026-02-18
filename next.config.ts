import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true, // required for App Router
  } as any,

  // Preserve your original output root
  outputFileTracingRoot: path.join(__dirname),

  // Preserve your webpack fallbacks
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'webworker-threads': false,
      'aws4': false,
    }
    return config
  },

  // Preserve your headers
async headers() {
  const corsHeaders = [
    { key: 'Access-Control-Allow-Origin', value: '*' },
    { key: 'Access-Control-Allow-Credentials', value: 'true' },
    { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
    { key: 'Vary', value: 'Origin' },
  ];

  return [
    { source: '/api/:path*', headers: corsHeaders },
    { source: '/_next/static/:path*', headers: corsHeaders },
    { source: '/_next/image', headers: corsHeaders },
    { source: '/uploads/:path*', headers: corsHeaders },
    { source: '/socket.io/:path*', headers: corsHeaders },
  ];
}
}

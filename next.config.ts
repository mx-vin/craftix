import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Webpack customizations
  webpack(config) {
    if (config.resolve) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'webworker-threads': false,
        'aws4': false,
      };
    }
    return config;
  },

  turbopack: {},

  // CORS headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

// Use a type assertion to avoid TypeScript errors for deprecated/extra props
export default nextConfig as NextConfig;

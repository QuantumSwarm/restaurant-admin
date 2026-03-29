/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable SWC minification
  swcMinify: true,

  // Image optimization
  images: {
    domains: [
      'localhost',
      // Add your image CDN domains here
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables exposed to the browser
  env: {
    APP_NAME: process.env.APP_NAME || 'Restaurant Admin Panel',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  },

  // Experimental features
  experimental: {
    // Enable if needed
    // serverActions: true,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add custom webpack config if needed
    return config;
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;

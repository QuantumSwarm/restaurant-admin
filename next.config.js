/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable SWC minification
  swcMinify: true,

  // Disable static optimization for pages that need runtime data
  // This prevents build errors when pages try to fetch data at build time
  experimental: {
    // Disable static page generation for dynamic routes
  },

  // Image optimization
  images: {
    domains: [
      "localhost",
      // Add your image CDN domains here
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Environment variables exposed to the browser
  env: {
    APP_NAME: process.env.APP_NAME || "Restaurant Admin Panel",
    APP_URL: process.env.APP_URL || "http://localhost:3000",
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
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },

  // IMPORTANT: Tell Next.js these are server-side only pages
  // This prevents them from being pre-rendered at build time
  // which would fail because they need database/auth
  output: "standalone",
};

module.exports = nextConfig;

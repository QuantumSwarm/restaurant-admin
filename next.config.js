/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // CRITICAL: Force everything to be server-rendered
  output: "standalone",

  // CRITICAL: Disable all static optimization
  experimental: {
    //appDir: true,
  },

  // Don't generate static error pages
  generateBuildId: async () => {
    return "build-" + Date.now();
  },

  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },

  env: {
    APP_NAME: process.env.APP_NAME || "Restaurant Admin Panel",
    APP_URL: process.env.APP_URL || "http://localhost:3000",
  },

  webpack: (config) => {
    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;

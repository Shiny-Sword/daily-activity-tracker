/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid Windows file-lock issues when webpack persists cache to disk.
      config.cache = { type: 'memory' };
    }
    return config;
  },
};

module.exports = nextConfig;

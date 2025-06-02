/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Ignore supabase-js if it somehow gets referenced
    config.resolve.alias = {
      ...config.resolve.alias,
      "supabase-js": false,
    }
    return config
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/supabase/**', '**/node_modules/**'],
    }
    return config
  },
}

module.exports = nextConfig

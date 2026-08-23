/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '0.0.0.0',
    '127.0.0.1:3000',
    'localhost:3000',
    '*.run.app',
    '*.ai.studio',
  ],
  experimental: {
    allowedDevOrigins: [
      '127.0.0.1',
      'localhost',
      '0.0.0.0',
      '127.0.0.1:3000',
      'localhost:3000',
      '*.run.app',
      '*.ai.studio',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

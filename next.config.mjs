/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pdf-parse'],
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '0.0.0.0',
    '127.0.0.1:3000',
    'localhost:3000',
    '*.run.app',
    '*.ai.studio',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

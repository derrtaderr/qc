/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // In Next.js 14.1.3, appDir is no longer experimental and is enabled by default
  experimental: {
    // Needed for PDF handling
    serverComponentsExternalPackages: ['pdf-parse'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Configure for file uploads
  async headers() {
    return [
      {
        source: '/api/extract-text',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer, dev }) => {
    // Add support for PDF.js worker
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force using browser-compatible versions of these modules
      'canvas': false,
      'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf',
    };
    
    // Make tesseract.js work with Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig 
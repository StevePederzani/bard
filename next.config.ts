import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost:3000',
    'bard.ozmium.org',
    'barcaster.pages.dev',
    'test.ozmium.org',
  ],
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019794f3-991a-c6bd-049f-abb98b49ff5c',
        permanent: false,
      },
    ]
  },
}

export default nextConfig

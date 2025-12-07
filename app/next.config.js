/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['api.modd.io'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
    NEXT_PUBLIC_RPC_ENDPOINT: process.env.NEXT_PUBLIC_RPC_ENDPOINT,
    NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID: process.env.NEXT_PUBLIC_FATE_ARENA_PROGRAM_ID,
    NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID: process.env.NEXT_PUBLIC_FATE_COUNCIL_PROGRAM_ID,
  },
}

module.exports = nextConfig

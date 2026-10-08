import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pglite trae wasm propio. se carga desde node_modules en runtime, sin bundlear.
  serverExternalPackages: ['@electric-sql/pglite'],
  poweredByHeader: false,
  // solo se empaquetan los íconos y gráficos que se usan
  experimental: { optimizePackageImports: ['lucide-react', 'recharts'] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig

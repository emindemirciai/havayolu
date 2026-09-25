import { resolve } from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Docker imajı için bağımsız sunucu çıktısı. Monorepo kökü izleme kökü olarak verilir.
  output: 'standalone',
  outputFileTracingRoot: resolve(process.cwd(), '../..'),
  transpilePackages: ['@ucus/shared', '@ucus/i18n'],
  poweredByHeader: false,
  reactStrictMode: true,
}

export default nextConfig

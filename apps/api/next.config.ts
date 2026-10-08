import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'payload',
    '@payloadcms/db-postgres',
    '@payloadcms/drizzle',
    '@payloadcms/next',
    '@payloadcms/richtext-lexical',
    '@payloadcms/ui',
    'drizzle-kit',
    'esbuild',
    'sharp',
    'pg',
  ],
  turbopack: {
    root: path.resolve(dirname, '../../'),
  },
}

export default nextConfig

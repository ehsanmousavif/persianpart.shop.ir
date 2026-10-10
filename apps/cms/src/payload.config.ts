import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Admins } from './collections/Admins'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Brands } from './collections/Brands'
import { Tags } from './collections/Tags'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { Plans } from './collections/Plans'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseUri = process.env.DATABASE_URI || process.env.DATABASE_URL || ''

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' - پنل مدیریت پرشین‌پارت',
    },
  },
  collections: [Admins, Users, Media, Categories, Brands, Tags, Products, Orders, Plans],
  editor: lexicalEditor(),
  graphQL: {
    disable: true,
  },
  secret: process.env.PAYLOAD_SECRET || 'persianpart-dev-secret-key-32-chars-long!!',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: databaseUri.startsWith('postgres')
    ? postgresAdapter({
        pool: {
          connectionString: databaseUri,
        },
        push: false,
      })
    : sqliteAdapter({
        client: {
          url: databaseUri || 'file:./payload.db',
        },
      }),
  sharp,
})

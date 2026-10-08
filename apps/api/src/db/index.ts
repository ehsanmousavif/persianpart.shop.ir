import { Pool } from 'pg'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URI ||
  'postgresql://postgres:8228@localhost:5432/persianpart_api'

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
}

export const pool: Pool =
  globalThis.__pgPool ||
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__pgPool = pool
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
    try {
      await client.query('SELECT 1')
      return true
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('[PostgreSQL Connection Error]:', err)
    return false
  }
}

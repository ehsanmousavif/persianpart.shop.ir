import { implement } from '@orpc/server'
import { healthContract } from '@persianpart/contract'
import type { Context } from '../context'
import { checkDbConnection } from '../db'

const implementer = implement(healthContract).$context<Context>()

export const healthRouter = implementer.router({
  ping: implementer.ping.handler(async () => {
    return {
      message: 'pong',
      timestamp: Date.now(),
    }
  }),

  check: implementer.check.handler(async () => {
    const isDbConnected = await checkDbConnection()
    return {
      status: isDbConnected ? 'ok' : 'degraded',
      service: 'persianpart-api',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: isDbConnected ? 'connected' : 'disconnected',
    }
  }),
})

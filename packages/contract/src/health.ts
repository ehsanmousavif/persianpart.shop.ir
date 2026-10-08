import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'

export const healthContract = {
  ping: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/health/ping',
        summary: 'Ping check',
        tags: ['Health'],
      })
    )
    .output(
      z.object({
        message: z.string(),
        timestamp: z.number(),
      })
    ),

  check: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/health/check',
        summary: 'System health check',
        tags: ['Health'],
      })
    )
    .output(
      z.object({
        status: z.enum(['ok', 'degraded', 'down']),
        service: z.string(),
        uptimeSeconds: z.number(),
        timestamp: z.string(),
        database: z.enum(['connected', 'disconnected']),
      })
    ),
}

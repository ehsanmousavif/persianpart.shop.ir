import { RPCHandler } from '@orpc/server/fetch'
import {
  GetMethodCsrfProtectionHandlerPlugin as StrictGetMethodPlugin,
  RequestHeadersPlugin,
  ResponseHeadersPlugin,
  CORSPlugin,
} from '@orpc/server/plugins'
import { base } from './base'
import { auth } from './routes/auth'
import { shopping, catalog } from './routes/shopping'
import { order } from './routes/order'
import { user, customer } from './routes/user'
import { system } from './routes/system'

export const router = base.router({
  health: base.health.handler(() => ({ status: 'ok' })),
  echo: base.echo.handler(({ input }) => ({ echo: input })),

  auth,
  catalog,
  shopping,
  order,
  customer,
  user,
  system,
})


export type AppRouter = typeof router

export const handler = new RPCHandler<any>(router, {
  plugins: [
    new StrictGetMethodPlugin(),
    new RequestHeadersPlugin(),
    new ResponseHeadersPlugin(),
    new CORSPlugin({
      origin: (origin) => origin,
      credentials: true,
      allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
    }),
  ],
})

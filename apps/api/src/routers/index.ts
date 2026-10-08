import { base } from '../rpc/base'
import { auth } from './auth'
import { shopping, catalog } from './shopping'
import { order } from './order'
import { user, customer } from './user'
import { system } from './system'
import { plan } from './plan'

export { auth, shopping, catalog, order, user, customer, system, plan }

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
  plan,
})

export type AppRouter = typeof router

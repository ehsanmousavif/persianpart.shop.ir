import { implement } from '@orpc/server'
import { pricingContract } from '@persianpart/contract'
import type { Context } from '../context'
import { validateCartItems } from '../services/pricing'

const implementer = implement(pricingContract).$context<Context>()

export const pricingRouter = implementer.router({
  validateCart: implementer.validateCart.handler(async ({ input, context }) => {
    return validateCartItems(input.items, context.customer?.customerTypeId)
  }),
})

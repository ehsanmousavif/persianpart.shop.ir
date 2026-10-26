import { sdk } from '../payload'
import { base, authed, adminOnly } from '../rpc/base'
import { fetchTaxonomy, getUserProfile } from './router.helpers'

const profile = authed.user.profile.handler(async ({ context }) => {
  return getUserProfile(context.user.id)
})

const update = authed.user.update.handler(async ({ input, context }) => {
  return sdk.update({
    collection: 'users',
    id: context.user.id,
    data: input,
  })
})

const list = adminOnly.user.list.handler(async ({ input }) => {
  const result = await sdk.find({
    collection: 'users',
    limit: input?.limit || 100,
    sort: '-createdAt',
  })
  return result.docs
})

const deleteUser = adminOnly.user.delete.handler(async ({ input }) => {
  return sdk.delete({ collection: 'users', id: input.id })
})

const customerTypes = base.user.customerTypes.handler(async ({ input }) => {
  return fetchTaxonomy('customer-types', { onlyActive: input?.onlyActive })
})

export const user = base.user.router({
  profile,
  list,
  update,
  delete: deleteUser,
  customerTypes,
})

import { sdk } from '../payload'
import { base } from '../rpc/base'

const profile = base.customer.profile.handler(async ({ context }) => {
  if (!context.user) return null
  return sdk.findByID({ collection: 'users', id: context.user.id })
})

const updateProfile = base.customer.updateProfile.handler(async ({ input, context }) => {
  if (!context.user) return null

  return sdk.update({
    collection: 'users',
    id: context.user.id,
    data: {
      fullName: input.contactName,
      companyName: input.storeName,
      nationalCode: input.nationalCode,
      economicCode: input.economicCode,
      province: input.province,
      city: input.city,
      address: input.address,
    },
  })
})

const types = base.customer.types.handler(async ({ input }) => {
  const where = input?.onlyActive !== false ? { isActive: { equals: true } } : undefined
  const res = await sdk.find({
    collection: 'customer-types',
    where,
    limit: 100,
    sort: 'name',
  })
  return res.docs
})

export const customer = base.customer.router({
  profile,
  updateProfile,
  types,
})

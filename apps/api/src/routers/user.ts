import { payload } from '../payload'
import { base } from '../rpc/base'

const profile = base.user.profile.handler(async ({ context, errors }) => {
  if (!context.user) throw errors.UNAUTHORIZED()
  return payload.crud.users.findByID({ id: context.user.id })
})

const update = base.user.update.handler(async ({ input, context, errors }) => {
  if (!context.user) throw errors.UNAUTHORIZED()

  // Customers can update personal, business, and address info, but phone is strictly immutable
  const { phone: _phone, ...allowedData } = input as any

  return payload.crud.users.update({
    id: context.user.id,
    data: allowedData,
  })
})

export const user = base.user.router({
  profile,
  update,
})

const customerProfile = base.customer.profile.handler(async ({ context }) => {
  if (!context.user) return null
  return payload.crud.users.findByID({ id: context.user.id })
})

const customerUpdateProfile = base.customer.updateProfile.handler(async ({ input, context }) => {
  if (!context.user) return null

  return payload.crud.users.update({
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

export const customer = base.customer.router({
  profile: customerProfile,
  updateProfile: customerUpdateProfile,
})

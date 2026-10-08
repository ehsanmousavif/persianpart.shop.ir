import { payload } from '@/payload'
import { base } from '@/rpc/base'

const profile = base.user.profile.handler(async ({ context, errors }) => {
  if (!context.user) throw errors.UNAUTHORIZED()
  return payload.crud.users.findByID({ id: context.user.id })
})

const update = base.user.update.handler(async ({ input, context, errors }) => {
  if (!context.user) throw errors.UNAUTHORIZED()
  return payload.crud.users.update({
    id: context.user.id,
    data: input,
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
      address: input.address,
    },
  })
})

export const customer = base.customer.router({
  profile: customerProfile,
  updateProfile: customerUpdateProfile,
})


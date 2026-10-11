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

const list = base.user.list.handler(async ({ input }) => {
  const result = await payload.crud.users.find({
    limit: input?.limit || 100,
    sort: '-createdAt',
  })
  return result.docs
})

const deleteUser = base.user.delete.handler(async ({ input }) => {
  return payload.crud.users.delete({ id: input.id })
})

const userCustomerTypes = base.user.customerTypes.handler(async ({ input }) => {
  const where = input?.onlyActive !== false ? { isActive: { equals: true } } : {}
  const res = await payload.crud['customer-types'].find({
    where,
    limit: 100,
    sort: 'name',
  })
  return res.docs
})

export const user = base.user.router({
  profile,
  list,
  update,
  delete: deleteUser,
  customerTypes: userCustomerTypes,
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

const customerTypes = base.customer.types.handler(async ({ input }) => {
  const where = input?.onlyActive !== false ? { isActive: { equals: true } } : {}
  const res = await payload.crud['customer-types'].find({
    where,
    limit: 100,
    sort: 'name',
  })
  return res.docs
})

export const customer = base.customer.router({
  profile: customerProfile,
  updateProfile: customerUpdateProfile,
  types: customerTypes,
})

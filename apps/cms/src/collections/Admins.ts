import type { CollectionConfig } from 'payload'

export const Admins: CollectionConfig = {
  slug: 'admins',
  labels: {
    singular: "Great Admin",
    plural: "Great Admins",
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'isActive', 'updatedAt'],
    group: 'دسترسی و مدیریت',
  },
  auth: true,
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام و نام خانوادگی مدیر',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      label: 'سطح دسترسی مدیریتی',
      options: [
        { label: 'مدیر کل سیستم (Super Admin)', value: 'superadmin' },
        { label: 'مدیر فروشگاه و سفارشات (Store Manager)', value: 'manager' },
        { label: 'ویرایشگر کاتالوگ و محتوا (Editor)', value: 'editor' },
        { label: 'پشتیبانی مشتریان (Support)', value: 'support' },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'حساب فعال است',
    },
  ],
}

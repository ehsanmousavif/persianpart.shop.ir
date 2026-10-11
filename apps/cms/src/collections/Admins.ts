import type { CollectionConfig } from 'payload'

export const Admins: CollectionConfig = {
  slug: 'admins',
  labels: {
    singular: 'مدیر',
    plural: 'مدیران',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'isActive', 'updatedAt'],
    group: 'تنظیمات و دسترسی‌ها',
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
      label: 'نام و نام خانوادگی',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      label: 'نقش',
      options: [
        { label: 'مدیر کل', value: 'superadmin' },
        { label: 'مدیر فروش', value: 'manager' },
        { label: 'ویرایشگر', value: 'editor' },
        { label: 'پشتیبانی', value: 'support' },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال',
    },
  ],
}

import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'دسته‌بندی کالا',
    plural: 'دسته‌بندی‌های کاتالوگ',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'ordering', 'isActive'],
    group: 'کاتالوگ و انبارداری',
    description: 'دسته‌بندی‌های کاتالوگ محصولات و قطعات',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام دسته‌بندی',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'اسلاگ انگلیسی (شناسه URL)',
      admin: {
        description: 'فقط حروف کوچک انگلیسی، اعداد و خط تیره (-)',
      },
    },
    {
      name: 'ordering',
      type: 'number',
      defaultValue: 0,
      label: 'ترتیب نمایش',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'دسته‌بندی والد (اختیاری)',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال در کاتالوگ',
    },
  ],
}

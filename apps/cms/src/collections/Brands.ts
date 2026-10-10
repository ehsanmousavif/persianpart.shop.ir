import type { CollectionConfig } from 'payload'

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: {
    singular: 'برند / سازنده',
    plural: 'برندها و کارخانجات',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isActive'],
    group: 'کاتالوگ و انبارداری',
    description: 'مدیریت برندها و کارخانجات تولیدکننده قطعات و محصولات',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام برند/کارخانه',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'اسلاگ انگلیسی',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'لوگو یا تصویر برند',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال در کاتالوگ',
    },
  ],
}

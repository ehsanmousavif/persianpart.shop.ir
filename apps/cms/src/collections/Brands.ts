import type { CollectionConfig } from 'payload'

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: {
    singular: 'برند',
    plural: 'برندها',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isActive'],
    group: 'کاتالوگ و انبارداری',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام برند',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'شناسه انگلیسی (Slug)',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'لوگو',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال',
    },
  ],
}

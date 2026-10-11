import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: {
    singular: 'برچسب',
    plural: 'برچسب‌ها',
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
      label: 'عنوان',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'شناسه انگلیسی (Slug)',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال',
    },
  ],
}

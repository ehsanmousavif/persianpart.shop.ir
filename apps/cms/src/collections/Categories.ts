import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'دسته‌بندی',
    plural: 'دسته‌بندی‌ها',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'ordering', 'isActive'],
    group: 'کاتالوگ و انبارداری',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'شناسه انگلیسی (Slug)',
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
      label: 'دسته‌بندی والد',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال',
    },
  ],
}

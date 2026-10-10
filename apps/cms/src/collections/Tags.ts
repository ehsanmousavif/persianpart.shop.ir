import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: {
    singular: 'برچسب (تگ)',
    plural: 'برچسب‌ها (تگ‌های کاتالوگ)',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'isActive'],
    group: 'کاتالوگ و انبارداری',
    description: 'برچسب‌های کاتالوگ برای دسته‌بندی و فیلتر کردن پیشرفته محصولات.',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'عنوان تگ',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'اسلاگ انگلیسی',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال',
    },
  ],
}

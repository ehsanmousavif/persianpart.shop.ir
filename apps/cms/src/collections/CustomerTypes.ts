import type { CollectionConfig } from 'payload'

export const CustomerTypes: CollectionConfig = {
  slug: 'customer-types',
  labels: {
    singular: 'نقش مشتری',
    plural: 'نقش‌های مشتریان',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'markupPercent', 'isActive', 'createdAt'],
    group: 'فروش و مشتریان',
    description: 'رده‌های مشتریان و ضریب قیمت (Markup).',
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
      label: 'عنوان رده',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'شناسه یکتا (Slug)',
    },
    {
      name: 'markupPercent',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'درصد تغییر قیمت (Markup %)',
      admin: {
        description: 'اثر بر قیمت پایه (مثبت: افزایش، منفی: تخفیف).',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'توضیحات',
    },
  ],
}

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
    group: 'فروشگاه و مشتریان',
    description: 'مدیریت رده‌ها و نقش‌های مشتریان با امکان تنظیم درصد افزایش/کاهش قیمت (Markup).',
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
      label: 'نام نوع مشتری (مانند عمده‌فروش، همکار، عادی)',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'شناسه متنی یکتا برای استفاده در سیستم (مانند wholesaler)',
    },
    {
      name: 'markupPercent',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'درصد افزایش قیمت (Markup %)',
      admin: {
        description: 'درصد اثرگذار بر قیمت پایه کالاها برای این نوع مشتری (مثبت برای افزایش، منفی برای تخفیف).',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال یا غیرفعال بودن نوع مشتری',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'توضیحات اختیاری',
    },
  ],
}

import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'تصویر و فایل رسانه‌ای',
    plural: 'رسانه‌ها و تصاویر',
  },
  admin: {
    group: 'رسانه و فایل‌ها',
    description: 'مدیریت تصاویر کالاها، لوگوها و فایل‌های سیستم',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'متن جایگزین (Alt)',
    },
  ],
  upload: true,
}

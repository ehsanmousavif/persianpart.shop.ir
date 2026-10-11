import type { CollectionConfig } from 'payload'

export const Dimensions: CollectionConfig = {
  slug: 'dimensions',
  labels: {
    singular: 'بُعد / سایز',
    plural: 'ابعاد کاشی',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'width', 'height', 'slug', 'isActive', 'createdAt'],
    group: 'کاتالوگ و انبار',
    description: 'مدیریت متمرکز ابعاد و سایزهای کاشی و سرامیک جهت انتخاب در کالاها و فیلترهای فروشگاه.',
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
      label: 'عنوان بُعد (مانند ۱۰۰×۱۰۰ یا ۶۰×۱۲۰)',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'width',
          type: 'number',
          required: true,
          label: 'عرض کاشی (سانتی‌متر)',
          admin: { width: '50%' },
        },
        {
          name: 'height',
          type: 'number',
          required: true,
          label: 'طول کاشی (سانتی‌متر)',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'شناسه انگلیسی یکتا (مانند 100x100 یا 60x120)',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال بودن بُعد جهت نمایش در فیلترها و کالاها',
    },
  ],
}

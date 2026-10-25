import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'مشتری',
    plural: 'مشتریان',
  },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'phone', 'customerType', 'status', 'companyName', 'createdAt'],
    group: 'مشتریان',
    description: 'فهرست مشتریان و خریداران تجاری.',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      required: true,
      unique: true,
      label: 'شماره همراه',
      admin: {
        description: 'شناسه ورود با کد یکبار مصرف (OTP).',
      },
    },
    {
      name: 'fullName',
      type: 'text',
      required: true,
      label: 'نام و نام خانوادگی',
    },
    {
      name: 'companyName',
      type: 'text',
      label: 'نام فروشگاه / شرکت',
    },
    {
      name: 'nationalCode',
      type: 'text',
      label: 'کد ملی',
    },
    {
      name: 'economicCode',
      type: 'text',
      label: 'کد اقتصادی',
    },
    {
      name: 'customerType',
      type: 'relationship',
      relationTo: 'customer-types',
      required: true,
      label: 'رده مشتری',
      admin: {
        description: 'تعیین‌کننده درصد قیمت و تخفیف کاتالوگ.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      label: 'وضعیت حساب',
      options: [
        { label: 'فعال', value: 'active' },
        { label: 'در انتظار بررسی', value: 'pending' },
        { label: 'مسدود', value: 'suspended' },
      ],
    },
    {
      name: 'province',
      type: 'text',
      label: 'استان',
    },
    {
      name: 'city',
      type: 'text',
      label: 'شهر',
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'نشانی',
    },
    {
      name: 'addresses',
      type: 'array',
      label: 'آدرس‌های تحویل',
      labels: {
        singular: 'نشانی',
        plural: 'نشانی‌ها',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'عنوان آدرس (انبار، پروژه...)',
        },
        {
          name: 'province',
          type: 'text',
          required: true,
          label: 'استان',
        },
        {
          name: 'city',
          type: 'text',
          required: true,
          label: 'شهر',
        },
        {
          name: 'postalCode',
          type: 'text',
          label: 'کد پستی',
        },
        {
          name: 'addressDetail',
          type: 'textarea',
          required: true,
          label: 'نشانی کامل و پلاک',
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'یادداشت داخلی',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}


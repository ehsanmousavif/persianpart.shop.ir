import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'سفارش',
    plural: 'سفارشات',
  },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'user', 'status', 'finalTotal', 'createdAt'],
    group: 'فروشگاه و مشتریان',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      label: 'شماره سفارش (کد پیگیری)',
      admin: {
        description: 'کد پیگیری یکتای سفارش خریدار',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'خریدار / مشتری',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'وضعیت سفارش',
      options: [
        { label: 'در انتظار بررسی (Pending)', value: 'pending' },
        { label: 'تأیید شده (Approved)', value: 'approved' },
        { label: 'در حال پردازش و آماده‌سازی (Processing)', value: 'processing' },
        { label: 'آماده تحویل (Ready)', value: 'ready' },
        { label: 'تکمیل شده (Completed)', value: 'completed' },
        { label: 'لغو شده (Cancelled)', value: 'cancelled' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      label: 'اقلام سفارش',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          label: 'محصول',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'requestedArea',
              type: 'number',
              required: true,
              label: 'متراژ درخواستی',
              admin: { width: '20%' },
            },
            {
              name: 'cartonCount',
              type: 'number',
              required: true,
              label: 'تعداد کارتن',
              admin: { width: '20%' },
            },
            {
              name: 'deliverableArea',
              type: 'number',
              required: true,
              label: 'متراژ تحویلی کارتن',
              admin: { width: '20%' },
            },
            {
              name: 'unitPrice',
              type: 'number',
              required: true,
              label: 'قیمت هر متر (تومان)',
              admin: { width: '20%' },
            },
            {
              name: 'totalPrice',
              type: 'number',
              required: true,
              label: 'قیمت کل قلم (تومان)',
              admin: { width: '20%' },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subtotal',
          type: 'number',
          required: true,
          label: 'جمع کل اقلام (تومان)',
          admin: { width: '25%' },
        },
        {
          name: 'discountAmount',
          type: 'number',
          defaultValue: 0,
          label: 'مبلغ تخفیف (تومان)',
          admin: { width: '25%' },
        },
        {
          name: 'taxAmount',
          type: 'number',
          defaultValue: 0,
          label: 'مالیات و عوارض (تومان)',
          admin: { width: '25%' },
        },
        {
          name: 'finalTotal',
          type: 'number',
          required: true,
          label: 'مبلغ نهایی فاکتور (تومان)',
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'deliveryAddress',
      type: 'textarea',
      label: 'آدرس و محل تخلیه بار',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'توضیحات و یادداشت سفارش',
    },
    {
      name: 'timeline',
      type: 'array',
      label: 'گاه‌شمار وضعیت سفارش',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'عنوان رویداد',
        },
        {
          name: 'description',
          type: 'text',
          label: 'توضیحات رویداد',
        },
        {
          name: 'timestamp',
          type: 'text',
          label: 'زمان رویداد',
        },
        {
          name: 'status',
          type: 'text',
          label: 'کد وضعیت',
        },
      ],
    },
  ],
}

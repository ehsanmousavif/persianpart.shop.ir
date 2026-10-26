import type { CollectionConfig } from 'payload'
import {
  calculateOrderTotals,
  syncInventoryOnChange,
  ensureOrderNumber,
} from './hooks/orders'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'سفارش مشتری',
    plural: 'سفارشات مشتریان',
  },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'user', 'status', 'finalTotal', 'createdAt'],
    group: 'فروش و مشتریان',
    description: 'فهرست و وضعیت سفارشات.',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  hooks: {
    beforeValidate: [calculateOrderTotals],
    beforeChange: [syncInventoryOnChange],
    afterChange: [ensureOrderNumber],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      label: 'شماره سفارش',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'مشتری',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'وضعیت سفارش',
      options: [
        { label: 'سفارش ثبت شده (در حال بررسی)', value: 'pending' },
        { label: 'حواله ثبت شده (تکمیل شده)', value: 'approve' },
        { label: 'تکمیل شده', value: 'completed' },
        { label: 'لغو توسط کاربر', value: 'cancelled_by_customer' },
        { label: 'لغو توسط ادمین', value: 'cancelled_by_admin' },
        { label: 'لغو شده', value: 'cancel' },
      ],
    },
    {
      name: 'cancelledBy',
      type: 'select',
      label: 'لغو شده توسط',
      options: [
        { label: 'کاربر', value: 'customer' },
        { label: 'ادمین', value: 'admin' },
      ],
      defaultValue: 'admin',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      label: 'اقلام سفارش',
      labels: {
        singular: 'قلم سفارش',
        plural: 'اقلام سفارش',
      },
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
      label: 'آدرس تحویل سفارش',
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
      labels: {
        singular: 'رویداد وضعیت',
        plural: 'گاه‌شمار رویدادها',
      },
      fields: [
        {
          name: 'timestamp',
          type: 'date',
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

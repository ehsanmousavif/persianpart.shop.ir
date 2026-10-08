import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'کاربر / خریدار',
    plural: 'کاربران و مشتریان',
  },
  admin: {
    useAsTitle: 'phone',
    defaultColumns: ['phone', 'fullName', 'customerType', 'status', 'createdAt'],
    group: 'فروشگاه و مشتریان',
  },
  auth: {
    // Customers can authenticate via their email or phone
    loginWithUsername: {
      allowEmailLogin: true,
      requireEmail: false,
    },
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      required: true,
      unique: true,
      label: 'شماره همراه (شناسه یکتا)',
      admin: {
        description: 'شماره موبایل معتبر (مثال: 09121234567)',
      },
    },
    {
      name: 'fullName',
      type: 'text',
      required: true,
      label: 'نام و نام خانوادگی خریدار',
    },
    {
      name: 'nationalCode',
      type: 'text',
      label: 'کد ملی (برای فاکتور رسمی)',
    },
    {
      name: 'customerType',
      type: 'select',
      required: true,
      defaultValue: 'regular',
      label: 'سطح و نوع مشتری',
      options: [
        { label: 'خریدار عادی (Regular)', value: 'regular' },
        { label: 'تعمیرکار / مکانیک (Mechanic)', value: 'mechanic' },
        { label: 'فروشگاه همکار (Store Partner)', value: 'store_partner' },
        { label: 'پخش‌کننده عمده (Wholesaler)', value: 'wholesaler' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      label: 'وضعیت حساب کاربری',
      options: [
        { label: 'فعال (Active)', value: 'active' },
        { label: 'در انتظار احراز هویت (Pending)', value: 'pending' },
        { label: 'معلق شده (Suspended)', value: 'suspended' },
      ],
    },
    {
      name: 'companyName',
      type: 'text',
      label: 'نام فروشگاه، نمایندگی یا تعمیرگاه',
    },
    {
      name: 'addresses',
      type: 'array',
      label: 'آدرس‌های ارسال سفارش',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'عنوان آدرس (مثلاً مغازه، انبار، منزل)',
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
          label: 'کد پستی ۱۰ رقمی',
        },
        {
          name: 'addressDetail',
          type: 'textarea',
          required: true,
          label: 'نشانی دقیق پستی و پلاک',
        },
      ],
    },
  ],
}

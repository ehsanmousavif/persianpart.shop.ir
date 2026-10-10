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
    group: 'فروشگاه و مشتریان',
    description: 'مشتریان سامانه توسط ادمین در این بخش تعریف می‌شوند. ورود به سایت منحصراً برای شماره‌های فعال در این لیست مجاز است.',
  },
  auth: {
    // Customers can authenticate via their email, phone or username
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
      label: 'شماره همراه مشتری (شناسه یکتا - ورود به سامانه)',
      admin: {
        description: 'این شماره به عنوان شناسه ورود مشتری استفاده می‌شود و مشتری امکان ویرایش آن را ندارد.',
      },
    },
    {
      name: 'fullName',
      type: 'text',
      required: true,
      label: 'نام و نام خانوادگی مشتری',
    },
    {
      name: 'companyName',
      type: 'text',
      label: 'نام فروشگاه، شرکت یا تعمیرگاه',
    },
    {
      name: 'nationalCode',
      type: 'text',
      label: 'کد ملی / شناسه ملی',
    },
    {
      name: 'economicCode',
      type: 'text',
      label: 'کد اقتصادی',
    },
    {
      name: 'customerType',
      type: 'select',
      required: true,
      defaultValue: 'regular',
      label: 'سطح و رده مشتری',
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
      label: 'وضعیت دسترسی به پنل',
      options: [
        { label: 'فعال (امکان ورود به پنل و سفارش)', value: 'active' },
        { label: 'در انتظار تایید مدارک (غیرفعال)', value: 'pending' },
        { label: 'معلق / مسدود شده (عدم امکان ورود)', value: 'suspended' },
      ],
    },
    {
      name: 'creditLimit',
      type: 'number',
      defaultValue: 0,
      label: 'سقف اعتبار خرید چکی/مدت‌دار (تومان)',
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
      label: 'نشانی پستی دقیق',
    },
    {
      name: 'addresses',
      type: 'array',
      label: 'دفترچه آدرس‌های ارسال سفارش',
      labels: {
        singular: 'نشانی پستی',
        plural: 'نشانی‌های پستی',
      },
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
    {
      name: 'notes',
      type: 'textarea',
      label: 'یادداشت‌های داخلی مدیریت (مشتری مشاهده نمی‌کند)',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}


import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'محصول / کاشی',
    plural: 'محصولات و کاتالوگ انبار',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'sqmPerCarton', 'isActive', 'updatedAt'],
    group: 'کاتالوگ و انبارداری',
    description: 'مدیریت مشخصات فنی کاشی، متراژ کارتن، موجودی انبار مکانیزه و تصاویر.',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        // Auto-generate slug if not specified
        if (!data.slug && data.sku) {
          data.slug = String(data.sku).toLowerCase().replace(/[^a-z0-9-]/g, '-')
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'sku',
          type: 'text',
          required: true,
          unique: true,
          label: 'کد کالا (SKU)',
          admin: {
            width: '50%',
            description: 'شناسه یکتای غیرقابل تغییر کالا در انبار',
          },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'نام کالا',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'اسلاگ یکتای محصول (URL)',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          label: 'دسته‌بندی',
          admin: { width: '50%' },
        },
        {
          name: 'brand',
          type: 'relationship',
          relationTo: 'brands',
          label: 'برند / کارخانه تولیدکننده',
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'color',
          type: 'text',
          label: 'رنگ کالا',
          admin: { width: '33.3%' },
        },
        {
          name: 'finish',
          type: 'select',
          label: 'فینیش / لعاب',
          admin: { width: '33.3%' },
          options: [
            { label: 'مات', value: 'matte' },
            { label: 'براق', value: 'glossy' },
            { label: 'پولیش', value: 'polished' },
            { label: 'سمی‌پولیش', value: 'semi_polished' },
            { label: 'شوگر', value: 'sugar' },
            { label: 'رستیک', value: 'rustic' },
          ],
        },
        {
          name: 'grade',
          type: 'select',
          label: 'درجه کیفی',
          admin: { width: '33.3%' },
          options: [
            { label: 'درجه ۱', value: 'grade_1' },
            { label: 'درجه ۲', value: 'grade_2' },
            { label: 'درجه ۳', value: 'grade_3' },
            { label: 'درجه ۴', value: 'grade_4' },
          ],
        },
      ],
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'تگ‌های محصول',
    },
    {
      type: 'collapsible',
      label: 'ابعاد و مشخصات بسته‌بندی کارتن (الزامی برای سفارش)',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'width',
              type: 'number',
              required: true,
              label: 'عرض کاشی (سانتی‌متر)',
              admin: { width: '25%' },
            },
            {
              name: 'height',
              type: 'number',
              required: true,
              label: 'طول کاشی (سانتی‌متر)',
              admin: { width: '25%' },
            },
            {
              name: 'piecesPerCarton',
              type: 'number',
              required: true,
              label: 'تعداد قطعه در هر کارتن',
              admin: { width: '25%' },
            },
            {
              name: 'sqmPerCarton',
              type: 'number',
              required: true,
              label: 'متراژ رسمی هر کارتن (متر مربع)',
              admin: {
                width: '25%',
                description: 'مبنای اصلی محاسبه کارتن و هزینه سفارش',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'قیمت‌گذاری و موجودی انبار مکانیزه',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'basePricePerSqm',
              type: 'number',
              defaultValue: 500000,
              label: 'قیمت پایه هر متر مربع (تومان)',
              admin: { width: '33.3%' },
            },
            {
              name: 'stockCartons',
              type: 'number',
              defaultValue: 350,
              label: 'موجودی انبار (تعداد کارتن)',
              admin: { width: '33.3%' },
            },
            {
              name: 'inventorySqm',
              type: 'number',
              defaultValue: 504,
              label: 'موجودی کل انبار (متر مربع)',
              admin: { width: '33.3%' },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'تصاویر و گالری محصول',
      fields: [
        {
          name: 'cover',
          type: 'upload',
          relationTo: 'media',
          label: 'تصویر شاخص (کاور اصلی)',
        },
        {
          name: 'gallery',
          type: 'array',
          label: 'تصاویر گالری محصول',
          labels: {
            singular: 'تصویر',
            plural: 'تصاویر',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'تصویر گالری',
            },
          ],
        },
      ],
    },
    {
      name: 'richDescription',
      type: 'richText',
      label: 'توضیحات تکمیلی محصول',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال بودن کالا در کاتالوگ',
    },
  ],
}

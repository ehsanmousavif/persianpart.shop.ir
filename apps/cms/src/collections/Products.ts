import type { CollectionConfig } from 'payload'
import { syncSlugAndDimensions } from './hooks/products'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'محصول',
    plural: 'محصولات',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'sqmPerCarton', 'isActive', 'updatedAt'],
    group: 'کاتالوگ و انبارداری',
    description: 'کاتالوگ و موجودی محصولات.',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeValidate: [syncSlugAndDimensions],
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
      label: 'اسلاگ (URL)',
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
          label: 'برند',
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
          label: 'رنگ',
          admin: { width: '50%' },
        },
        {
          name: 'grade',
          type: 'select',
          label: 'درجه کیفی',
          admin: { width: '50%' },
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
      label: 'ویژگی‌ها و برچسب‌ها',
    },
    {
      type: 'collapsible',
      label: 'ابعاد و ضریب متراژ',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'dimension',
              type: 'relationship',
              relationTo: 'dimensions',
              required: true,
              label: 'ابعاد',
              admin: {
                width: '50%',
              },
            },
            {
              name: 'sqmPerCarton',
              type: 'number',
              required: true,
              label: 'ضریب متراژ هر کارتن (م²)',
              admin: {
                width: '50%',
                description: 'ضرایب پرکاربرد: ۱.۴۴، ۱.۰۸، ۲.۱۶، ۱.۹۲',
              },
            },
            {
              name: 'width',
              type: 'number',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'height',
              type: 'number',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'piecesPerCarton',
              type: 'number',
              defaultValue: 4,
              admin: {
                hidden: true,
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'قیمت و موجودی',
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
              label: 'موجودی کارتن',
              admin: { width: '33.3%' },
            },
            {
              name: 'inventorySqm',
              type: 'number',
              defaultValue: 504,
              label: 'موجودی متراژ (م²)',
              admin: { width: '33.3%' },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'تصاویر کالا',
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

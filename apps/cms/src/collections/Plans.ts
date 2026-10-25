import type { CollectionConfig } from 'payload'
import {
  personalizePlanBeforeValidate,
  personalizePlanAfterRead,
} from './hooks/plans'

export const Plans: CollectionConfig = {
  slug: 'plans',
  labels: {
    singular: 'طرح اختصاصی',
    plural: 'طرح‌ها و بسته‌ها',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'users', 'createdAt'],
    group: 'مشتریان',
    description: 'طرح‌ها و تخفیف‌های مشتریان.',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeValidate: [personalizePlanBeforeValidate],
    afterRead: [personalizePlanAfterRead],
  },
  fields: [
    {
      name: 'users',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: true,
      label: 'مشتری هدف',
      admin: {
        description: 'کاربری که این طرح به او اختصاص داده می‌شود.',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'متن طرح',
      admin: {
        description: 'متن پیام یا توضیحات طرح برای کاربر.',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'عنوان طرح',
      admin: {
        hidden: true,
      },
    },
  ],
}

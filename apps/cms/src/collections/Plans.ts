import type { CollectionConfig } from 'payload'

export const Plans: CollectionConfig = {
  slug: 'plans',
  labels: {
    singular: 'طرح اختصاصی',
    plural: 'طرح‌ها و بسته‌ها',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'discountPercent', 'status', 'users', 'createdAt'],
    group: 'مدیریت فروش و مشتریان',
    description: 'مدیریت طرح‌ها، تخفیف‌ها و پیام‌های خوش‌آمدگویی اختصاصی برای کاربران و مشتریان منتخب.',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data) return data

        let targetName = 'همکار'
        if (Array.isArray(data.users) && data.users.length > 0) {
          const firstUserId =
            typeof data.users[0] === 'object' && data.users[0] !== null
              ? (data.users[0] as any).id
              : data.users[0]

          try {
            const userDoc = await req.payload.findByID({
              collection: 'users',
              id: firstUserId,
              depth: 0,
            })
            if (userDoc) {
              targetName =
                (userDoc as any).fullName ||
                (userDoc as any).companyName ||
                (userDoc as any).phone ||
                'همکار'
            }
          } catch {
            // fallback
          }
        }

        const replacePlaceholders = (text: string): string => {
          if (!text) return text
          return text
            .replace(/\{\{\s*user\.name\s*\}\}/gi, targetName)
            .replace(/\{\{\s*user\s*\}\}/gi, targetName)
            .replace(/\{\{\s*name\s*\}\}/gi, targetName)
            .replace(/\{name\}/gi, targetName)
            .replace(/\{user\}/gi, targetName)
            .replace(/\[نام\s*کاربر\]/gi, targetName)
            .replace(/\[نام\s*مشتری\]/gi, targetName)
            .replace(/\[نام\]/gi, targetName)
        }

        // 1. Dynamic title generation
        if (!data.title || data.title.trim() === '') {
          data.title = `${targetName} عزیز، این طرح برای شماست`
        } else {
          data.title = replacePlaceholders(data.title)
        }

        // 2. Automatic personalization of content with target user name
        if (data.content && typeof data.content === 'string') {
          let personalizedContent = replacePlaceholders(data.content)
          if (
            targetName !== 'همکار' &&
            !personalizedContent.includes(targetName)
          ) {
            personalizedContent = `${targetName} عزیز؛ ${personalizedContent}`
          }
          data.content = personalizedContent
        }

        return data
      },
    ],
    afterRead: [
      ({ doc, context }) => {
        const contextName =
          (context as any)?.name ||
          (context as any)?.user?.fullName ||
          (context as any)?.user?.companyName

        if (contextName) {
          doc.dynamicTitle = `${contextName} عزیز، این طرح برای شماست`
          const replaceText = (str: string) => {
            if (!str) return str
            return str
              .replace(/\{\{\s*user\.name\s*\}\}/gi, contextName)
              .replace(/\{\{\s*name\s*\}\}/gi, contextName)
              .replace(/\{name\}/gi, contextName)
              .replace(/\[نام\s*کاربر\]/gi, contextName)
          }
          if (doc.title) doc.title = replaceText(doc.title)
          if (doc.content) doc.content = replaceText(doc.content)
        } else {
          doc.dynamicTitle = doc.title
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان طرح (اسم)',
      admin: {
        description:
          'در صورت خالی بودن، به صورت خودکار به شکل «[نام کاربر] عزیز، این طرح برای شماست» تولید می‌شود. همچنین می‌توانید از {name} در متن استفاده کنید.',
      },
    },
    {
      name: 'users',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: true,
      label: 'کاربران هدف (لیست Userها)',
      admin: {
        description: 'مشخص کنید این طرح به کدام کاربر یا کاربران اختصاص داده می‌شود.',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'متن پیام / توضیحات طرح (Textarea)',
      admin: {
        description: 'متنی که برای کاربر در این طرح ارسال یا نمایش داده می‌شود (مثلاً شرایط پرداخت مدت‌دار ۳ ماهه یا توضیحات آفر ویژه).',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'credit_terms',
      label: 'نوع طرح تجاری (طرح اعتباری یا تخفیف کالا)',
      options: [
        {
          label: 'شرایط اعتباری و مدت‌دار (پرداخت اقساطی / بازپرداخت ۳ ماهه)',
          value: 'credit_terms',
        },
        {
          label: 'تخفیف روی کالاها (اعمال درصد تخفیف روی اقلام منتخب)',
          value: 'product_discount',
        },
      ],
      admin: {
        description: 'تعیین کنید این طرح اعتباری/مدت‌دار است یا تخفیف مستقیم روی کالاها.',
      },
    },
    {
      type: 'row',
      admin: {
        condition: (data) => data?.type === 'product_discount',
      },
      fields: [
        {
          name: 'discountPercent',
          type: 'number',
          defaultValue: 10,
          label: 'درصد تخفیف روی کالاها (%)',
          admin: {
            width: '50%',
            description: 'درصد تخفیف اعمالی روی محصولات منتخب طرح (مثلاً ۱۰ یا ۱۵ درصد)',
          },
        },
        {
          name: 'discountAmount',
          type: 'number',
          label: 'مبلغ تخفیف ثابت (تومان - اختیاری)',
          admin: {
            width: '50%',
            description: 'تخفیف مقطوع به تومان به جای درصدی',
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      label: 'وضعیت طرح (Status)',
      options: [
        {
          label: 'در حال اجرا (فعال)',
          value: 'active',
        },
        {
          label: 'منقضی شده',
          value: 'expired',
        },
        {
          label: 'پیش‌نویس',
          value: 'draft',
        },
      ],
      admin: {
        description: 'وضعیت اجرای طرح: در حال اجرا، منقضی شده یا پیش‌نویس.',
      },
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'محصولات پیشنهادی طرح (اختیاری)',
      admin: {
        description: 'کالاهای منتخب برای این طرح تجاری.',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'تاریخ و مهلت انقضا (اختیاری)',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}

import type { CollectionConfig } from 'payload'

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

        if (!data.status) {
          data.status = 'active'
        }
        if (!data.type) {
          data.type = 'credit_terms'
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

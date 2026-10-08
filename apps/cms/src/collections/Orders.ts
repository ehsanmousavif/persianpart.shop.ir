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
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) return data

        // 1. Auto-generate orderNumber if missing
        if (!data.orderNumber) {
          const timestamp = Date.now().toString().slice(-6)
          const randomSuffix = Math.floor(10 + Math.random() * 90)
          data.orderNumber = `PP-${timestamp}${randomSuffix}`
        }

        // 2. Calculate item metrics and order totals
        if (Array.isArray(data.items) && data.items.length > 0) {
          let calculatedSubtotal = 0
          for (const item of data.items) {
            const productId = typeof item.product === 'object' && item.product !== null ? (item.product as any).id : item.product
            if (productId) {
              try {
                const productDoc = await req.payload.findByID({
                  collection: 'products',
                  id: productId,
                  depth: 0,
                })

                if (productDoc) {
                  const sqmPerCarton = (productDoc as any).sqmPerCarton || 1.44
                  const basePrice = (productDoc as any).basePricePerSqm || 500000
                  const requestedArea = Number(item.requestedArea) || 1
                  
                  const cartonCount = item.cartonCount || Math.ceil(requestedArea / sqmPerCarton)
                  const deliverableArea = item.deliverableArea || Math.round(cartonCount * sqmPerCarton * 100) / 100
                  const unitPrice = item.unitPrice || basePrice
                  const totalPrice = item.totalPrice || Math.round(deliverableArea * unitPrice)

                  item.cartonCount = cartonCount
                  item.deliverableArea = deliverableArea
                  item.unitPrice = unitPrice
                  item.totalPrice = totalPrice

                  calculatedSubtotal += totalPrice
                }
              } catch {
                // If product lookup fails, retain existing item numbers
                calculatedSubtotal += Number(item.totalPrice) || 0
              }
            }
          }

          if (!data.subtotal || data.subtotal === 0) {
            data.subtotal = calculatedSubtotal
          }
          const discount = Number(data.discountAmount) || 0
          const tax = Number(data.taxAmount) || 0
          data.finalTotal = Math.max(0, (data.subtotal || calculatedSubtotal) - discount + tax)
        }

        // 3. Initialize timeline on create
        if (operation === 'create' && (!data.timeline || data.timeline.length === 0)) {
          data.timeline = [
            {
              title: 'ثبت سفارش',
              description: 'سفارش توسط خریدار در سامانه ثبت گردید و در انتظار تأیید بازرگانی است.',
              timestamp: new Date().toISOString(),
              status: data.status || 'pending',
            },
          ]
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, operation }) => {
        if (!data) return data

        // If updating status, record timeline event automatically
        if (operation === 'update' && originalDoc && data.status && data.status !== originalDoc.status) {
          const statusLabels: Record<string, { title: string; desc: string }> = {
            approved: {
              title: 'تأیید واحد بازرگانی',
              desc: 'بررسی اعتبار تجاری و تخصیص سهمیه از انبار/خط تولید انجام شد.',
            },
            processing: {
              title: 'در حال آماده‌سازی و بارگیری',
              desc: 'پالت‌بندی کالاها و آماده‌سازی بار در انبار مکانیزه در جریان است.',
            },
            ready: {
              title: 'آماده تحویل / صدور بارنامه',
              desc: 'سفارش آماده خروج از انبار شده و بارنامه صادر گردید.',
            },
            completed: {
              title: 'تکمیل شده و تحویل نهایی',
              desc: 'تخلیه بار در انبار مقصد انجام و سفارش با موفقیت تحویل شد.',
            },
            cancelled: {
              title: 'لغو سفارش',
              desc: data.notes ? `سفارش لغو گردید. (${data.notes})` : 'سفارش لغو گردید.',
            },
          }

          const info = statusLabels[data.status]
          if (info) {
            const currentTimeline = Array.isArray(data.timeline)
              ? [...data.timeline]
              : Array.isArray(originalDoc.timeline)
                ? [...originalDoc.timeline]
                : []

            currentTimeline.push({
              title: info.title,
              description: info.desc,
              timestamp: new Date().toISOString(),
              status: data.status,
            })
            data.timeline = currentTimeline
          }
        }

        return data
      },
    ],
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

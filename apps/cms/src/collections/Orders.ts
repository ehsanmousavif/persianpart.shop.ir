import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'سفارش مشتری',
    plural: 'سفارشات مشتریان',
  },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'user', 'status', 'finalTotal', 'createdAt'],
    group: 'فروشگاه و مشتریان',
    description: 'مدیریت و پیگیری کلیه سفارشات ثبت‌شده خریداران، فرآیند آماده‌سازی و ارسال بار.',
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

        // 3. Set cancellation deadline (10 minutes from creation) on create
        if (operation === 'create') {
          if (!data.cancellationDeadline) {
            data.cancellationDeadline = new Date(Date.now() + 10 * 60 * 1000).toISOString()
          }
          if (!data.timeline || data.timeline.length === 0) {
            data.timeline = [
              {
                title: 'ثبت سفارش خریدار',
                description: 'سفارش توسط خریدار در سامانه ثبت گردید و در صف بررسی واحد بازرگانی قرار گرفت.',
                timestamp: new Date().toISOString(),
                status: data.status || 'pending',
              },
            ]
          }
        }

        return data
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (!data) return data

        // A. Handle Inventory decrement on order creation
        if (operation === 'create' && Array.isArray(data.items)) {
          for (const item of data.items) {
            const productId =
              typeof item.product === 'object' && item.product !== null
                ? (item.product as any).id
                : item.product

            if (productId) {
              try {
                const productDoc = await req.payload.findByID({
                  collection: 'products',
                  id: productId,
                  depth: 0,
                })
                if (productDoc) {
                  const cartonCount = Number(item.cartonCount) || 0
                  const deliverableArea = Number(item.deliverableArea) || 0
                  const currentCartons = Number((productDoc as any).stockCartons ?? 350)
                  const currentSqm = Number((productDoc as any).inventorySqm ?? 504)

                  const nextCartons = Math.max(0, currentCartons - cartonCount)
                  const nextSqm = Math.max(0, Math.round((currentSqm - deliverableArea) * 100) / 100)

                  await req.payload.update({
                    collection: 'products',
                    id: productId,
                    data: {
                      stockCartons: nextCartons,
                      inventorySqm: nextSqm,
                    },
                  })
                }
              } catch (err) {
                console.error('Failed to decrement product stock:', err)
              }
            }
          }
        }

        // B. Handle Inventory restoration on cancellation (by customer or admin)
        const isCancelledStatus = (s?: string) =>
          s === 'cancelled' || s === 'cancelled_by_customer' || s === 'cancelled_by_admin'

        if (
          operation === 'update' &&
          originalDoc &&
          data.status &&
          isCancelledStatus(data.status) &&
          !isCancelledStatus(originalDoc.status)
        ) {
          const itemsToRestore = Array.isArray(originalDoc.items)
            ? originalDoc.items
            : Array.isArray(data.items)
              ? data.items
              : []

          for (const item of itemsToRestore) {
            const productId =
              typeof item.product === 'object' && item.product !== null
                ? (item.product as any).id
                : item.product

            if (productId) {
              try {
                const productDoc = await req.payload.findByID({
                  collection: 'products',
                  id: productId,
                  depth: 0,
                })
                if (productDoc) {
                  const cartonCount = Number(item.cartonCount) || 0
                  const deliverableArea = Number(item.deliverableArea) || 0
                  const currentCartons = Number((productDoc as any).stockCartons ?? 350)
                  const currentSqm = Number((productDoc as any).inventorySqm ?? 504)

                  const restoredCartons = currentCartons + cartonCount
                  const restoredSqm = Math.round((currentSqm + deliverableArea) * 100) / 100

                  await req.payload.update({
                    collection: 'products',
                    id: productId,
                    data: {
                      stockCartons: restoredCartons,
                      inventorySqm: restoredSqm,
                    },
                  })
                }
              } catch (err) {
                console.error('Failed to restore product stock on cancel:', err)
              }
            }
          }
        }

        // C. Record timeline event automatically on status change
        if (operation === 'update' && originalDoc && data.status && data.status !== originalDoc.status) {
          const statusLabels: Record<string, { title: string; desc: string }> = {
            pending: {
              title: 'در انتظار تأیید اولیه',
              desc: 'سفارش ثبت شده و در نوبت کارشناسی اولیه قرار دارد.',
            },
            checking: {
              title: 'در حال بررسی واحد بازرگانی',
              desc: 'کارشناس بازرگانی در حال ارزیابی شرایط فاکتور، سهمیه تخصیصی و استعلام خط تولید است.',
            },
            approved: {
              title: 'تأیید واحد بازرگانی',
              desc: 'بررسی مالی، احراز هویت و صدور حواله انبار توسط مدیریت بازرگانی انجام شد.',
            },
            preparing: {
              title: 'در حال آماده‌سازی و بارگیری انبار',
              desc: 'پالت‌بندی کالاها، بسته‌بندی تسمه‌ای و آماده‌سازی بار در انبار مکانیزه در جریان است.',
            },
            processing: {
              title: 'در حال آماده‌سازی و بارگیری انبار',
              desc: 'پالت‌بندی کالاها و آماده‌سازی بار در انبار مکانیزه در جریان است.',
            },
            shipping: {
              title: 'در حال ارسال و صدور بارنامه',
              desc: 'بارنامه رسمی صادر شد و سفارش جهت حمل بین‌شهری تحویل ناوگان باربری گردید.',
            },
            ready: {
              title: 'آماده تحویل و صدور بارنامه',
              desc: 'سفارش آماده خروج از انبار شده و بارنامه صادر گردید.',
            },
            completed: {
              title: 'تکمیل شده و تحویل قطعی',
              desc: 'تخلیه بار در انبار مقصد انجام و سفارش با موفقیت تحویل خریدار گردید.',
            },
            cancelled_by_customer: {
              title: 'لغو سفارش توسط خریدار',
              desc: data.notes
                ? `سفارش در مهلت مقرر توسط خریدار لغو گردید. (${data.notes})`
                : 'سفارش در مهلت ۱۰ دقیقه‌ای توسط خریدار لغو شد و موجودی انبار بازگردانی گردید.',
            },
            cancelled_by_admin: {
              title: 'لغو سفارش توسط مدیریت / بازرگانی',
              desc: data.notes
                ? `سفارش توسط مدیریت لغو گردید. (${data.notes})`
                : 'سفارش بنا به دلایل اداری یا مالی توسط مدیریت لغو و موجودی به انبار برگشت داده شد.',
            },
            cancelled: {
              title: 'لغو سفارش',
              desc: data.notes ? `سفارش لغو گردید. (${data.notes})` : 'سفارش لغو شد و موجودی انبار بازگردانی گردید.',
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
        { label: 'در انتظار تأیید اولیه (Pending)', value: 'pending' },
        { label: 'در حال بررسی واحد بازرگانی (Checking)', value: 'checking' },
        { label: 'تأیید شده بازرگانی (Approved)', value: 'approved' },
        { label: 'در حال آماده‌سازی و بارگیری (Preparing)', value: 'preparing' },
        { label: 'در حال ارسال و حمل بار (Shipping)', value: 'shipping' },
        { label: 'تکمیل شده و تحویل نهایی (Completed)', value: 'completed' },
        { label: 'لغو شده توسط خریدار (Cancelled by Customer)', value: 'cancelled_by_customer' },
        { label: 'لغو شده توسط مدیریت / بازرگانی (Cancelled by Staff)', value: 'cancelled_by_admin' },
        { label: 'لغو شده (سایر)', value: 'cancelled' },
      ],
      admin: {
        description: 'موقعیت عملیاتی سفارش در گردش کار تأمین و انبارداری',
      },
    },
    {
      name: 'cancellationDeadline',
      type: 'date',
      label: 'مهلت ۱۰ دقیقه‌ای لغو سفارش خریدار',
      admin: {
        description: 'تا این زمان خریدار فرصت دارد سفارش را لغو کند. پس از آن سفارش نهایی و قفل می‌گردد.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
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
      labels: {
        singular: 'رویداد وضعیت',
        plural: 'گاه‌شمار رویدادها',
      },
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

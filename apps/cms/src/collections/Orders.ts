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
    group: 'مشتریان',
    description: 'فهرست و وضعیت سفارشات.',
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
          data.orderNumber = `ptp ${timestamp}`
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
          s === 'cancel' || s === 'cancelled' || s === 'cancelled_by_customer' || s === 'cancelled_by_admin'

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

        // C. Normalize cancellation status & initiator
        if (data.status === 'cancelled_by_customer') {
          data.cancelledBy = 'customer'
        } else if (data.status === 'cancelled_by_admin') {
          data.cancelledBy = 'admin'
        } else if (data.status === 'cancel') {
          if (data.cancelledBy === 'customer') {
            data.status = 'cancelled_by_customer'
          } else {
            data.status = 'cancelled_by_admin'
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' && (!doc.orderNumber || !doc.orderNumber.startsWith('ptp '))) {
          try {
            await req.payload.update({
              collection: 'orders',
              id: doc.id,
              data: {
                orderNumber: `ptp ${doc.id}`,
              },
            })
          } catch {}
        }
      },
    ],
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

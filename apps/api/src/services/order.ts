import { pool } from '../db'
import type {
  Order,
  OrderItemSnapshot,
  OrderStatus,
  OrderTimelineEvent,
  PrepareReorderOutput,
} from '@persianpart/contract'
import {
  calculateCustomerPrice,
  calculatePackaging,
} from './pricing'
import { logAuditEvent } from './audit'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_review: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function isValidStatusTransition(current: OrderStatus, target: OrderStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false
}

export async function submitOrder(
  customerId: string,
  items: Array<{ productId: string; requestedSqm: number }>,
  notes?: string
): Promise<Order> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Load customer and customerType
    const custRes = await client.query(
      `SELECT c.id, c.store_name, c.is_active, ct.id as customer_type_id, ct.name as customer_type_name, ct.markup_percent
       FROM customers c
       JOIN customer_types ct ON c.customer_type_id = ct.id
       WHERE c.id = $1`,
      [customerId]
    )

    if (custRes.rows.length === 0) {
      throw new Error('حساب مشتری یافت نشد')
    }
    const customer = custRes.rows[0]
    if (!customer.is_active) {
      throw new Error('حساب مشتری غیرفعال است و امکان ثبت سفارش ندارد')
    }

    const markupPercent = Number(customer.markup_percent)

    // 2. Fetch cancellation window config
    let cancellationWindowMinutes = 120
    const configRes = await client.query(`SELECT value FROM global_configs WHERE key = 'ordering'`)
    if (configRes.rows.length > 0 && configRes.rows[0].value?.customerCancellationWindowMinutes) {
      cancellationWindowMinutes = Number(configRes.rows[0].value.customerCancellationWindowMinutes)
    }

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const orderItems: OrderItemSnapshot[] = []
    let totalAmount = 0
    let totalSqm = 0
    let totalCartons = 0

    // 3. Process each item with SELECT FOR UPDATE (Concurrency Protection)
    for (const item of items) {
      const prodRes = await client.query(
        `SELECT id, sku, name, sqm_per_carton, base_price_per_sqm, inventory_sqm, is_active
         FROM products WHERE id = $1 FOR UPDATE`,
        [item.productId]
      )

      if (prodRes.rows.length === 0) {
        throw new Error(`کالای ${item.productId} در کاتالوگ موجود نیست`)
      }

      const prod = prodRes.rows[0]
      if (!prod.is_active) {
        throw new Error(`کالای ${prod.name} غیرفعال است`)
      }

      const sqmPerCarton = Number(prod.sqm_per_carton)
      const basePrice = Number(prod.base_price_per_sqm)
      const currentInventory = Number(prod.inventory_sqm)

      const { cartonCount, actualSqm } = calculatePackaging(item.requestedSqm, sqmPerCarton)
      const finalPrice = calculateCustomerPrice(basePrice, markupPercent)
      const lineTotal = Math.round(actualSqm * finalPrice)

      if (actualSqm > currentInventory) {
        throw new Error(
          `موجودی کالای ${prod.name} (${prod.sku}) کافی نیست. موجودی: ${currentInventory} متر مربع، درخواستی: ${actualSqm} متر مربع`
        )
      }

      // Atomic inventory deduction
      await client.query(
        `UPDATE products SET inventory_sqm = inventory_sqm - $1, updated_at = NOW() WHERE id = $2`,
        [actualSqm, prod.id]
      )

      const itemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const snapshot: OrderItemSnapshot = {
        id: itemId,
        orderId,
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        requestedSqm: item.requestedSqm,
        cartonCount,
        sqmPerCarton,
        actualSqm,
        basePricePerSqm: basePrice,
        customerTypeId: customer.customer_type_id,
        customerTypeName: customer.customer_type_name,
        markupPercent,
        finalPricePerSqm: finalPrice,
        lineTotal,
      }

      orderItems.push(snapshot)
      totalAmount += lineTotal
      totalSqm += actualSqm
      totalCartons += cartonCount
    }

    const cancellationDeadline = new Date(Date.now() + cancellationWindowMinutes * 60 * 1000).toISOString()

    // 4. Create Order
    await client.query(
      `INSERT INTO orders (id, customer_id, status, total_amount, total_sqm, total_cartons, notes, cancellation_deadline, created_at, updated_at)
       VALUES ($1, $2, 'pending_review', $3, $4, $5, $6, $7, NOW(), NOW())`,
      [orderId, customerId, totalAmount, totalSqm, totalCartons, notes || null, cancellationDeadline]
    )

    // 5. Insert Order Items Snapshots
    for (const oi of orderItems) {
      await client.query(
        `INSERT INTO order_items (
          id, order_id, product_id, sku, product_name, requested_sqm, carton_count,
          sqm_per_carton, actual_sqm, base_price_per_sqm, customer_type_id,
          customer_type_name, markup_percent, final_price_per_sqm, line_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          oi.id,
          oi.orderId,
          oi.productId,
          oi.sku,
          oi.productName,
          oi.requestedSqm,
          oi.cartonCount,
          oi.sqmPerCarton,
          oi.actualSqm,
          oi.basePricePerSqm,
          oi.customerTypeId,
          oi.customerTypeName,
          oi.markupPercent,
          oi.finalPricePerSqm,
          oi.lineTotal,
        ]
      )
    }

    // 6. Insert Timeline Event
    const timelineId = `time-${Date.now()}`
    const timelineEvent: OrderTimelineEvent = {
      id: timelineId,
      orderId,
      eventType: 'order_created',
      actorType: 'customer',
      actorId: customerId,
      timestamp: new Date().toISOString(),
      metadata: { itemsCount: orderItems.length, totalAmount },
    }

    await client.query(
      `INSERT INTO order_timelines (id, order_id, event_type, actor_type, actor_id, metadata, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        timelineEvent.id,
        timelineEvent.orderId,
        timelineEvent.eventType,
        timelineEvent.actorType,
        timelineEvent.actorId,
        JSON.stringify(timelineEvent.metadata || {}),
      ]
    )

    await client.query('COMMIT')

    await logAuditEvent({
      actorType: 'customer',
      actorId: customerId,
      actorName: customer.store_name,
      action: 'order_created',
      entityType: 'order',
      entityId: orderId,
      metadata: { totalAmount, totalSqm },
    })

    return {
      id: orderId,
      customerId,
      customerStoreName: customer.store_name,
      status: 'pending_review',
      items: orderItems,
      totalAmount,
      totalSqm: Number(totalSqm.toFixed(4)),
      totalCartons,
      notes: notes || undefined,
      cancellationDeadline,
      timeline: [timelineEvent],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function cancelOrder(
  orderId: string,
  actorType: 'customer' | 'staff',
  actorId: string,
  options?: { reason?: string; note?: string }
): Promise<Order> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Lock order
    const orderRes = await client.query(
      `SELECT id, customer_id, status, cancellation_deadline FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    )

    if (orderRes.rows.length === 0) {
      throw new Error('سفارش یافت نشد')
    }

    const orderRow = orderRes.rows[0]
    const currentStatus = orderRow.status as OrderStatus

    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      throw new Error(`سفارش در وضعیت نهایی (${currentStatus}) است و امکان لغو ندارد`)
    }

    if (actorType === 'customer') {
      const deadline = new Date(orderRow.cancellation_deadline).getTime()
      if (Date.now() > deadline) {
        throw new Error('مهلت مجاز لغو مستقیم سفارش توسط مشتری به پایان رسیده است')
      }
    }

    // 2. Load order items to restore stock
    const itemsRes = await client.query(
      `SELECT product_id, actual_sqm FROM order_items WHERE order_id = $1`,
      [orderId]
    )

    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE products SET inventory_sqm = inventory_sqm + $1, updated_at = NOW() WHERE id = $2`,
        [item.actual_sqm, item.product_id]
      )
    }

    // 3. Update order status
    await client.query(
      `UPDATE orders 
       SET status = 'cancelled', 
           cancellation_reason = $1, 
           cancellation_note = $2, 
           updated_at = NOW()
       WHERE id = $3`,
      [options?.reason || (actorType === 'customer' ? 'لغو توسط مشتری' : 'لغو توسط پرسنل'), options?.note || null, orderId]
    )

    // 4. Record timeline
    const timelineEvent: OrderTimelineEvent = {
      id: `time-${Date.now()}`,
      orderId,
      eventType: actorType === 'customer' ? 'customer_cancelled' : 'staff_cancelled',
      actorType,
      actorId,
      timestamp: new Date().toISOString(),
      metadata: { reason: options?.reason, note: options?.note },
    }

    await client.query(
      `INSERT INTO order_timelines (id, order_id, event_type, actor_type, actor_id, metadata, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        timelineEvent.id,
        timelineEvent.orderId,
        timelineEvent.eventType,
        timelineEvent.actorType,
        timelineEvent.actorId,
        JSON.stringify(timelineEvent.metadata || {}),
      ]
    )

    await client.query('COMMIT')

    await logAuditEvent({
      actorType,
      actorId,
      action: actorType === 'customer' ? 'order_customer_cancelled' : 'order_staff_cancelled',
      entityType: 'order',
      entityId: orderId,
      metadata: { reason: options?.reason },
    })

    return getOrderById(orderId)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  staffId: string,
  note?: string
): Promise<Order> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const orderRes = await client.query(
      `SELECT id, status FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    )

    if (orderRes.rows.length === 0) {
      throw new Error('سفارش یافت نشد')
    }

    const currentStatus = orderRes.rows[0].status as OrderStatus
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new Error(`انتقال وضعیت از ${currentStatus} به ${newStatus} غیرمجاز است`)
    }

    await client.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, orderId]
    )

    const eventType = newStatus === 'completed' ? 'order_completed' : 'status_changed'
    await client.query(
      `INSERT INTO order_timelines (id, order_id, event_type, actor_type, actor_id, metadata, timestamp)
       VALUES ($1, $2, $3, 'staff', $4, $5, NOW())`,
      [
        `time-${Date.now()}`,
        orderId,
        eventType,
        staffId,
        JSON.stringify({ from: currentStatus, to: newStatus, note }),
      ]
    )

    await client.query('COMMIT')

    await logAuditEvent({
      actorType: 'staff',
      actorId: staffId,
      action: 'order_status_updated',
      entityType: 'order',
      entityId: orderId,
      metadata: { from: currentStatus, to: newStatus, note },
    })

    return getOrderById(orderId)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getOrderById(orderId: string): Promise<Order> {
  const orderRes = await pool.query(
    `SELECT o.*, c.store_name as customer_store_name
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.id = $1`,
    [orderId]
  )

  if (orderRes.rows.length === 0) {
    throw new Error('سفارش یافت نشد')
  }

  const row = orderRes.rows[0]

  const itemsRes = await pool.query(
    `SELECT * FROM order_items WHERE order_id = $1`,
    [orderId]
  )

  const items: OrderItemSnapshot[] = itemsRes.rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    productId: r.product_id,
    sku: r.sku,
    productName: r.product_name,
    requestedSqm: Number(r.requested_sqm),
    cartonCount: Number(r.carton_count),
    sqmPerCarton: Number(r.sqm_per_carton),
    actualSqm: Number(r.actual_sqm),
    basePricePerSqm: Number(r.base_price_per_sqm),
    customerTypeId: r.customer_type_id,
    customerTypeName: r.customer_type_name,
    markupPercent: Number(r.markup_percent),
    finalPricePerSqm: Number(r.final_price_per_sqm),
    lineTotal: Number(r.line_total),
  }))

  const timelineRes = await pool.query(
    `SELECT * FROM order_timelines WHERE order_id = $1 ORDER BY timestamp ASC`,
    [orderId]
  )

  const timeline: OrderTimelineEvent[] = timelineRes.rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    eventType: r.event_type,
    actorType: r.actor_type,
    actorId: r.actor_id,
    timestamp: new Date(r.timestamp).toISOString(),
    metadata: r.metadata || {},
  }))

  return {
    id: row.id,
    customerId: row.customer_id,
    customerStoreName: row.customer_store_name,
    status: row.status,
    items,
    totalAmount: Number(row.total_amount),
    totalSqm: Number(row.total_sqm),
    totalCartons: Number(row.total_cartons),
    notes: row.notes || undefined,
    cancellationDeadline: new Date(row.cancellation_deadline).toISOString(),
    cancellationReason: row.cancellation_reason || undefined,
    cancellationNote: row.cancellation_note || undefined,
    timeline,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function prepareReorder(orderId: string, customerId: string): Promise<PrepareReorderOutput> {
  const order = await getOrderById(orderId)
  if (order.customerId !== customerId) {
    throw new Error('دسترسی به سفارش سایر مشتریان مجاز نیست')
  }

  // Evaluate each historical item against current catalog
  const comparisonItems = []
  let allReady = true

  for (const item of order.items) {
    const prodRes = await pool.query(
      `SELECT p.id, p.sku, p.name, p.sqm_per_carton, p.base_price_per_sqm, p.inventory_sqm, p.is_active,
              c.customer_type_id, ct.markup_percent
       FROM products p
       CROSS JOIN customers c
       JOIN customer_types ct ON c.customer_type_id = ct.id
       WHERE p.id = $1 AND c.id = $2`,
      [item.productId, customerId]
    )

    if (prodRes.rows.length === 0 || !prodRes.rows[0].is_active) {
      comparisonItems.push({
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        status: 'unavailable' as const,
        requestedSqm: item.requestedSqm,
        historicalPricePerSqm: item.finalPricePerSqm,
        historicalSqmPerCarton: item.sqmPerCarton,
        availableStockSqm: 0,
      })
      allReady = false
      continue
    }

    const prod = prodRes.rows[0]
    const currentPrice = calculateCustomerPrice(Number(prod.base_price_per_sqm), Number(prod.markup_percent))
    const currentSqmPerCarton = Number(prod.sqm_per_carton)
    const stock = Number(prod.inventory_sqm)

    const { actualSqm } = calculatePackaging(item.requestedSqm, currentSqmPerCarton)

    let status: 'ready' | 'changed' | 'out_of_stock' = 'ready'
    if (stock < actualSqm) {
      status = 'out_of_stock'
      allReady = false
    } else if (currentPrice !== item.finalPricePerSqm || currentSqmPerCarton !== item.sqmPerCarton) {
      status = 'changed'
    }

    comparisonItems.push({
      productId: item.productId,
      sku: prod.sku,
      productName: prod.name,
      status,
      requestedSqm: item.requestedSqm,
      currentPricePerSqm: currentPrice,
      historicalPricePerSqm: item.finalPricePerSqm,
      currentSqmPerCarton,
      historicalSqmPerCarton: item.sqmPerCarton,
      availableStockSqm: stock,
    })
  }

  return {
    originalOrderId: orderId,
    items: comparisonItems,
    canSubmitDirectly: allReady,
    notes: allReady ? 'تمام اقلام با موجودی و مشخصات جاری آماده سفارش مجدد هستند' : 'برخی اقلام تغییر قیمت، مشخصات یا کمبود موجودی دارند',
  }
}

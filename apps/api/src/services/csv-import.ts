import { pool } from '../db'
import type {
  CsvRowDiff,
  ImportPreviewReport,
  ImportRunSummary,
  SuspiciousChangeWarning,
} from '@persianpart/contract'
import { logAuditEvent } from './audit'

export interface ParsedCsvRow {
  rowNumber: number
  sku: string
  price: number
  inventory: number
}

export function parseCsvContent(content: string): {
  validRows: ParsedCsvRow[]
  invalidRowErrors: Array<{ rowNumber: number; error: string }>
  duplicateSkus: string[]
} {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
  if (lines.length < 2) {
    throw new Error('فایل CSV باید حداقل شامل یک ردیف عنوان و یک ردیف داده باشد')
  }

  // Header detection
  const headerLine = lines[0].toLowerCase()
  const delimiter = headerLine.includes(';') ? ';' : ','
  const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''))

  const skuIdx = headers.findIndex((h) => h.includes('sku') || h.includes('کد'))
  const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('قیمت'))
  const inventoryIdx = headers.findIndex((h) => h.includes('inventory') || h.includes('stock') || h.includes('موجودی'))

  if (skuIdx === -1 || priceIdx === -1 || inventoryIdx === -1) {
    throw new Error('ستون‌های الزامی در فایل CSV یافت نشدند (باید شامل sku, price, inventory یا معادل فارسی آنها باشند)')
  }

  const validRows: ParsedCsvRow[] = []
  const invalidRowErrors: Array<{ rowNumber: number; error: string }> = []
  const seenSkus = new Set<string>()
  const duplicateSkus = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1
    const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''))

    const rawSku = cols[skuIdx]
    const rawPrice = cols[priceIdx]
    const rawInventory = cols[inventoryIdx]

    if (!rawSku) {
      invalidRowErrors.push({ rowNumber: rowNum, error: 'کد SKU خالی است' })
      continue
    }

    if (seenSkus.has(rawSku)) {
      duplicateSkus.add(rawSku)
      invalidRowErrors.push({ rowNumber: rowNum, error: `کد SKU تکراری در فایل: ${rawSku}` })
      continue
    }
    seenSkus.add(rawSku)

    const price = parseFloat(rawPrice)
    const inventory = parseFloat(rawInventory)

    if (isNaN(price) || price < 0) {
      invalidRowErrors.push({ rowNumber: rowNum, error: `قیمت نامعتبر یا منفی است: ${rawPrice}` })
      continue
    }

    if (isNaN(inventory) || inventory < 0) {
      invalidRowErrors.push({ rowNumber: rowNum, error: `موجودی نامعتبر یا منفی است: ${rawInventory}` })
      continue
    }

    validRows.push({
      rowNumber: rowNum,
      sku: rawSku,
      price,
      inventory,
    })
  }

  return {
    validRows,
    invalidRowErrors,
    duplicateSkus: Array.from(duplicateSkus),
  }
}

export async function createImportPreview(
  filename: string,
  csvContent: string,
  actorId: string
): Promise<ImportPreviewReport> {
  const { validRows, invalidRowErrors } = parseCsvContent(csvContent)

  const diffs: CsvRowDiff[] = []
  const unknownSkus: string[] = []
  const suspiciousWarnings: SuspiciousChangeWarning[] = []

  let changedRows = 0
  let unchangedRows = 0
  let priceChangesCount = 0
  let inventoryChangesCount = 0
  let outOfStockCount = 0
  let backInStockCount = 0

  for (const row of validRows) {
    const prodRes = await pool.query(
      `SELECT id, sku, name, base_price_per_sqm, inventory_sqm FROM products WHERE sku = $1`,
      [row.sku]
    )

    if (prodRes.rows.length === 0) {
      unknownSkus.push(row.sku)
      continue
    }

    const prod = prodRes.rows[0]
    const oldPrice = Number(prod.base_price_per_sqm)
    const oldInventory = Number(prod.inventory_sqm)

    const priceChanged = oldPrice !== row.price
    const inventoryChanged = oldInventory !== row.inventory

    if (priceChanged) priceChangesCount++
    if (inventoryChanged) inventoryChangesCount++

    if (priceChanged || inventoryChanged) {
      changedRows++
    } else {
      unchangedRows++
    }

    const isNewOutOfStock = row.inventory === 0 && oldInventory > 0
    const isBackInStock = row.inventory > 0 && oldInventory === 0

    if (isNewOutOfStock) outOfStockCount++
    if (isBackInStock) backInStockCount++

    let priceDiffPercent = 0
    if (oldPrice > 0) {
      priceDiffPercent = Number((((row.price - oldPrice) / oldPrice) * 100).toFixed(1))
    }

    const inventoryDiff = Number((row.inventory - oldInventory).toFixed(2))

    // Suspicious checks
    if (Math.abs(priceDiffPercent) >= 50) {
      suspiciousWarnings.push({
        type: 'large_price_jump',
        sku: row.sku,
        message: `تغییر قیمت کالای ${prod.name} (${row.sku}) بیش از ۵۰٪ است (${priceDiffPercent}%).`,
      })
    }

    if (oldInventory > 0 && row.inventory > oldInventory * 4) {
      suspiciousWarnings.push({
        type: 'large_inventory_jump',
        sku: row.sku,
        message: `افزایش موجودی کالای ${prod.name} (${row.sku}) بیش از ۳۰۰٪ است (از ${oldInventory} به ${row.inventory}).`,
      })
    }

    diffs.push({
      sku: row.sku,
      productName: prod.name,
      oldPrice,
      newPrice: row.price,
      oldInventory,
      newInventory: row.inventory,
      priceDiffPercent,
      inventoryDiff,
      isNewOutOfStock,
      isBackInStock,
    })
  }

  const importRunId = `import-${Date.now()}`
  const totalRows = validRows.length + invalidRowErrors.length

  const report: ImportPreviewReport = {
    importRunId,
    filename,
    totalRows,
    validRows: validRows.length,
    changedRows,
    unchangedRows,
    unknownSkuCount: unknownSkus.length,
    invalidRowCount: invalidRowErrors.length,
    unknownSkus,
    invalidRowErrors,
    priceChangesCount,
    inventoryChangesCount,
    outOfStockCount,
    backInStockCount,
    suspiciousWarnings,
    diffs,
  }

  // Persist preview run
  await pool.query(
    `INSERT INTO import_runs (
      id, filename, actor_id, status, total_rows, valid_rows, changed_rows,
      unchanged_rows, unknown_sku_rows, invalid_rows, report, created_at
    ) VALUES ($1, $2, $3, 'preview', $4, $5, $6, $7, $8, $9, $10, NOW())`,
    [
      importRunId,
      filename,
      actorId,
      totalRows,
      validRows.length,
      changedRows,
      unchangedRows,
      unknownSkus.length,
      invalidRowErrors.length,
      JSON.stringify(report),
    ]
  )

  return report
}

export async function applyImportRun(importRunId: string, actorId: string): Promise<ImportRunSummary> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const runRes = await client.query(
      `SELECT id, filename, status, report FROM import_runs WHERE id = $1 FOR UPDATE`,
      [importRunId]
    )

    if (runRes.rows.length === 0) {
      throw new Error('شناسه پیش‌نمایش ایمپورت یافت نشد')
    }

    const run = runRes.rows[0]
    if (run.status === 'applied') {
      throw new Error('این پیش‌نمایش قبلاً اعمال شده است')
    }

    const report = run.report as ImportPreviewReport
    const diffs = report.diffs || []

    for (const diff of diffs) {
      await client.query(
        `UPDATE products
         SET base_price_per_sqm = $1, inventory_sqm = $2, updated_at = NOW()
         WHERE sku = $3`,
        [diff.newPrice, diff.newInventory, diff.sku]
      )
    }

    await client.query(
      `UPDATE import_runs 
       SET status = 'applied', applied_at = NOW() 
       WHERE id = $1`,
      [importRunId]
    )

    await client.query('COMMIT')

    await logAuditEvent({
      actorType: 'staff',
      actorId,
      action: 'csv_apply',
      entityType: 'import_run',
      entityId: importRunId,
      metadata: {
        filename: run.filename,
        appliedItemsCount: diffs.length,
      },
    })

    const updated = await pool.query(`SELECT * FROM import_runs WHERE id = $1`, [importRunId])
    const r = updated.rows[0]

    return {
      id: r.id,
      filename: r.filename,
      actorId: r.actor_id,
      status: r.status,
      totalRows: Number(r.total_rows),
      validRows: Number(r.valid_rows),
      changedRows: Number(r.changed_rows),
      unknownSkuRows: Number(r.unknown_sku_rows),
      invalidRows: Number(r.invalid_rows),
      appliedAt: r.applied_at ? new Date(r.applied_at).toISOString() : null,
      createdAt: new Date(r.created_at).toISOString(),
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

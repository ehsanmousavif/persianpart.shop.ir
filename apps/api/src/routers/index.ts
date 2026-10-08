import { healthRouter } from './health'
import { partsRouter } from './parts'
import { cmsRouter } from './cms'
import { authRouter } from './auth'
import { customerTypeRouter } from './customer-type'
import { customerRouter } from './customer'
import { categoryRouter } from './category'
import { brandRouter } from './brand'
import { tagRouter } from './tag'
import { productRouter } from './product'
import { catalogRouter } from './catalog'
import { pricingRouter } from './pricing'
import { orderRouter } from './order'
import { csvImportRouter } from './csv-import'
import { auditRouter } from './audit'
import { globalsRouter } from './globals'

export const appRouter = {
  health: healthRouter,
  cms: cmsRouter,
  parts: partsRouter,
  auth: authRouter,
  customerType: customerTypeRouter,
  customer: customerRouter,
  category: categoryRouter,
  brand: brandRouter,
  tag: tagRouter,
  product: productRouter,
  catalog: catalogRouter,
  pricing: pricingRouter,
  order: orderRouter,
  csvImport: csvImportRouter,
  audit: auditRouter,
  globals: globalsRouter,
}

export type AppRouter = typeof appRouter

export * from './health'
export * from './cms'
export * from './parts'
export * from './auth'
export * from './customer-type'
export * from './customer'
export * from './category'
export * from './brand'
export * from './tag'
export * from './product'
export * from './catalog'
export * from './pricing'
export * from './order'
export * from './csv-import'
export * from './audit'
export * from './globals'

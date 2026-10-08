import { authRouter } from './auth'
import { catalogRouter } from './catalog'
import { customerRouter } from './customer'
import { orderRouter } from './order'
import { cmsRouter } from './cms'
import { systemRouter } from './system'

// Sub-routers for backward compatibility
import { healthRouter } from './health'
import { partsRouter } from './parts'
import { customerTypeRouter } from './customer-type'
import { categoryRouter } from './category'
import { brandRouter } from './brand'
import { tagRouter } from './tag'
import { productRouter } from './product'
import { pricingRouter } from './pricing'
import { csvImportRouter } from './csv-import'
import { auditRouter } from './audit'
import { globalsRouter } from './globals'

/**
 * Root Router for PersianPart API.
 * Consolidated into 6 Core Bounded Context Domains:
 * 1. auth - Authentication, customer registration, admin sessions
 * 2. catalog - Unified spare parts, products, categories, brands, tags, search
 * 3. customer - Customer profiles, address book, wholesale/mechanic tiers
 * 4. order - Checkout, cart submission, pricing calculations, order tracking
 * 5. cms - Integration status & media synchronization with Payload CMS
 * 6. system - Health checks, site globals, audit trails, CSV imports
 */
export const appRouter = {
  // 6 Primary Domain Routers
  auth: authRouter,
  catalog: catalogRouter,
  customer: customerRouter,
  order: orderRouter,
  cms: cmsRouter,
  system: systemRouter,

  // Backward compatibility aliases
  health: healthRouter,
  parts: partsRouter,
  customerType: customerTypeRouter,
  category: categoryRouter,
  brand: brandRouter,
  tag: tagRouter,
  product: productRouter,
  pricing: pricingRouter,
  csvImport: csvImportRouter,
  audit: auditRouter,
  globals: globalsRouter,
}

export type AppRouter = typeof appRouter

// Domain exports
export * from './auth'
export * from './catalog'
export * from './customer'
export * from './order'
export * from './cms'
export * from './system'

// Legacy exports
export * from './health'
export * from './parts'
export * from './customer-type'
export * from './category'
export * from './brand'
export * from './tag'
export * from './product'
export * from './pricing'
export * from './csv-import'
export * from './audit'
export * from './globals'

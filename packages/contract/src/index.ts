import { authContract } from './auth'
import { catalogContract } from './catalog'
import { customerContract } from './customer'
import { orderContract } from './order'
import { cmsContract } from './cms'
import { systemContract } from './system'

// Legacy / sub-contracts for backward compatibility
import { customerTypeContract } from './customer-type'
import { categoryContract } from './category'
import { brandContract } from './brand'
import { tagContract } from './tag'
import { productContract } from './product'
import { pricingContract } from './pricing'
import { csvImportContract } from './csv-import'
import { auditContract } from './audit'
import { globalsContract } from './globals'
import { healthContract } from './health'
import { partsContract } from './parts'

/**
 * Root Contract for PersianPart Monorepo.
 * Structured around 6 Core Bounded Context Domains:
 * 1. auth - Authentication, customer registration, admin sessions
 * 2. catalog - Unified spare parts, products, categories, brands, tags, search
 * 3. customer - Customer profiles, address book, wholesale/mechanic tiers
 * 4. order - Checkout, cart submission, pricing calculations, order tracking
 * 5. cms - Integration status & media synchronization with Payload CMS
 * 6. system - Health checks, site globals, audit trails, CSV imports
 */
export const appContract = {
  // 6 Primary Domain Routers
  auth: authContract,
  catalog: catalogContract,
  customer: customerContract,
  order: orderContract,
  cms: cmsContract,
  system: systemContract,

  // Backward compatibility aliases
  health: healthContract,
  cmsStatus: cmsContract,
  parts: partsContract,
  customerType: customerTypeContract,
  category: categoryContract,
  brand: brandContract,
  tag: tagContract,
  product: productContract,
  pricing: pricingContract,
  csvImport: csvImportContract,
  audit: auditContract,
  globals: globalsContract,
}

export type AppContract = typeof appContract

// Re-export all domain modules and schemas
export * from './common'
export * from './auth'
export * from './catalog'
export * from './customer'
export * from './order'
export * from './cms'
export * from './system'

// Re-export sub-contracts for backward compatibility
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

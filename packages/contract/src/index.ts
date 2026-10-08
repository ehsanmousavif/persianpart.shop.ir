import { authContract } from './auth'
import { customerTypeContract } from './customer-type'
import { customerContract } from './customer'
import { categoryContract } from './category'
import { brandContract } from './brand'
import { tagContract } from './tag'
import { productContract } from './product'
import { catalogContract } from './catalog'
import { pricingContract } from './pricing'
import { orderContract } from './order'
import { csvImportContract } from './csv-import'
import { auditContract } from './audit'
import { globalsContract } from './globals'
import { healthContract } from './health'
import { cmsContract } from './cms'
import { partsContract } from './parts'

export const appContract = {
  health: healthContract,
  cms: cmsContract,
  parts: partsContract,
  auth: authContract,
  customerType: customerTypeContract,
  customer: customerContract,
  category: categoryContract,
  brand: brandContract,
  tag: tagContract,
  product: productContract,
  catalog: catalogContract,
  pricing: pricingContract,
  order: orderContract,
  csvImport: csvImportContract,
  audit: auditContract,
  globals: globalsContract,
}

export type AppContract = typeof appContract

// Re-export all sub-contracts and schemas
export * from './common'
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

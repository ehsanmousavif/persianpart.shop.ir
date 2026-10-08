import { authContract } from './auth'
import { catalogContract } from './catalog'
import { customerContract } from './customer'
import { orderContract } from './order'
import { systemContract } from './system'

/**
 * Root Contract for PersianPart Monorepo.
 * Consolidated into 5 Core Bounded Context Domains:
 * 1. auth     - Customer OTP authentication & staff sessions
 * 2. catalog  - Unified products, spare parts, categories, brands, tags & carton calculation
 * 3. customer - Customer profile, staff customer management & customer pricing tiers
 * 4. order    - Order lifecycle, reorder preparation, staff order workflow & cart pricing validation
 * 5. system   - Health probes, global settings, audit trail, CSV batch import & Payload CMS integration
 */
export const appContract = {
  auth: authContract,
  catalog: catalogContract,
  customer: customerContract,
  order: orderContract,
  system: systemContract,
}

export type AppContract = typeof appContract

export * from './common'
export * from './auth'
export * from './catalog'
export * from './customer'
export * from './order'
export * from './system'

import { implement } from '@orpc/server'
import { systemContract } from '@persianpart/contract'
import type { Context } from '../context'
import { healthRouter } from './health'
import { globalsRouter } from './globals'
import { auditRouter } from './audit'
import { csvImportRouter } from './csv-import'

const implementer = implement(systemContract).$context<Context>()

/**
 * Unified System Domain Router
 * Consolidates: Health probes, Global config, Audit trail, and CSV imports.
 */
export const systemRouter = implementer.router({
  health: healthRouter,
  globals: globalsRouter,
  audit: auditRouter,
  csvImport: csvImportRouter,
})

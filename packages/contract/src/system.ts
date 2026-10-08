import { healthContract } from './health'
import { globalsContract, GlobalConfigSchema, CommerceConfigSchema, OrderingConfigSchema, CatalogConfigSchema, SupportConfigSchema } from './globals'
import { auditContract, AuditEventSchema, AuditActionSchema, AuditActorTypeSchema } from './audit'
import { csvImportContract, ImportPreviewReportSchema, ImportRunSummarySchema } from './csv-import'

export {
  healthContract,
  globalsContract,
  auditContract,
  csvImportContract,
  GlobalConfigSchema,
  CommerceConfigSchema,
  OrderingConfigSchema,
  CatalogConfigSchema,
  SupportConfigSchema,
  AuditEventSchema,
  AuditActionSchema,
  AuditActorTypeSchema,
  ImportPreviewReportSchema,
  ImportRunSummarySchema,
}

export type {
  GlobalConfig,
  CommerceConfig,
  OrderingConfig,
  CatalogConfig,
  SupportConfig,
} from './globals'

export type {
  AuditEvent,
  AuditAction,
  AuditActorType,
} from './audit'

export type {
  ImportPreviewReport,
  ImportRunSummary,
} from './csv-import'

/**
 * Unified System Domain Contract
 * Consolidates: Health probes, Global configuration, Audit logging, and CSV Batch Operations.
 */
export const systemContract = {
  health: healthContract,
  globals: globalsContract,
  audit: auditContract,
  csvImport: csvImportContract,
}

export type SystemContract = typeof systemContract

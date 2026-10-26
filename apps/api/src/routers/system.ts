import { base, adminOnly } from '../rpc/base'

const preview = adminOnly.system.csvImport.preview.handler(async ({ input }) => {
  return {
    validCount: 0,
    errorCount: 0,
    errors: [],
    previewRows: [],
    filename: input.filename,
  }
})

const apply = adminOnly.system.csvImport.apply.handler(async () => {
  return {
    success: true,
    importedCount: 0,
  }
})

const listRuns = adminOnly.system.csvImport.listRuns.handler(async () => {
  return {
    items: [],
    total: 0,
  }
})

const auditList = adminOnly.system.audit.list.handler(async () => {
  return {
    items: [],
    total: 0,
  }
})

export const system = base.system.router({
  csvImport: {
    preview,
    apply,
    listRuns,
  },
  audit: {
    list: auditList,
  },
})

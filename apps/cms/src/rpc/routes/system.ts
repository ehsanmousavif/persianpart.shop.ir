import { base } from '@/rpc/base'

const preview = base.system.csvImport.preview.handler(async ({ input }) => {
  return {
    validCount: 0,
    errorCount: 0,
    errors: [],
    previewRows: [],
    filename: input.filename,
  }
})

const apply = base.system.csvImport.apply.handler(async () => {
  return {
    success: true,
    importedCount: 0,
  }
})

const listRuns = base.system.csvImport.listRuns.handler(async () => {
  return {
    items: [],
    total: 0,
  }
})

const auditList = base.system.audit.list.handler(async () => {
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

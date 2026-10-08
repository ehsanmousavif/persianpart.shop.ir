import { implement } from '@orpc/server'
import { cmsContract } from '@persianpart/contract'
import type { Context } from '../context'
import { getCmsStatus, listCmsMedia } from '../services/cms'

const implementer = implement(cmsContract).$context<Context>()

export const cmsRouter = implementer.router({
  getStatus: implementer.getStatus.handler(async () => {
    return getCmsStatus()
  }),

  listMedia: implementer.listMedia.handler(async ({ input }) => {
    return listCmsMedia(input.page, input.limit)
  }),
})

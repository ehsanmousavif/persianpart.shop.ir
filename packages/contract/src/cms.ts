import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'

export const CmsStatusSchema = z.object({
  cmsUrl: z.string(),
  isReachable: z.boolean(),
  collections: z.array(z.string()),
})

export const CmsMediaItemSchema = z.object({
  id: z.string().or(z.number()),
  alt: z.string().optional(),
  filename: z.string().optional(),
  mimeType: z.string().optional(),
  filesize: z.number().optional(),
  url: z.string().optional(),
  createdAt: z.string().optional(),
})

export type CmsStatus = z.infer<typeof CmsStatusSchema>
export type CmsMediaItem = z.infer<typeof CmsMediaItemSchema>

export const cmsContract = {
  getStatus: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/cms/status',
        summary: 'Get CMS connection status',
        tags: ['CMS Integration'],
      })
    )
    .output(CmsStatusSchema),

  listMedia: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/cms/media',
        summary: 'List media from Payload CMS',
        tags: ['CMS Integration'],
      })
    )
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(10),
          page: z.number().min(1).default(1),
        })
        .default({})
    )
    .output(
      z.object({
        docs: z.array(CmsMediaItemSchema),
        totalDocs: z.number(),
        limit: z.number(),
        totalPages: z.number(),
        page: z.number(),
      })
    ),
}

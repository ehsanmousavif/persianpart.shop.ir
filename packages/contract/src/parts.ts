import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'

export const PartSchema = z.object({
  id: z.string(),
  partNumber: z.string(),
  nameFa: z.string(),
  nameEn: z.string(),
  category: z.string(),
  vehicleBrand: z.string(),
  vehicleModels: z.array(z.string()),
  priceTomans: z.number(),
  stock: z.number(),
  isOriginal: z.boolean(),
})

export type Part = z.infer<typeof PartSchema>

export const partsContract = {
  list: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/parts',
        summary: 'List automotive spare parts',
        tags: ['Parts'],
      })
    )
    .input(
      z
        .object({
          brand: z.string().optional(),
          category: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .default({})
    )
    .output(
      z.object({
        items: z.array(PartSchema),
        total: z.number(),
        limit: z.number(),
        offset: z.number(),
      })
    ),

  getById: oc
    .meta(
      openapi({
        method: 'GET',
        path: '/parts/{id}',
        summary: 'Get part by ID',
        tags: ['Parts'],
      })
    )
    .input(
      z.object({
        id: z.string(),
      })
    )
    .errors({
      NOT_FOUND: {
        message: 'قطعه مورد نظر در انبار یا کاتالوگ پرشین پارت یافت نشد',
      },
    })
    .output(PartSchema),
}

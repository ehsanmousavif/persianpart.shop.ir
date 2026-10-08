import { oc } from '@orpc/contract'
import { z } from 'zod'

export const contract = {
  health: oc.output(
    z.object({
      status: z.string(),
    })
  ),

  echo: oc
    .input(z.any())
    .output(
      z.object({
        echo: z.any(),
      })
    ),

  auth: {
    requestOtp: oc
      .errors({ FORBIDDEN: {}, BAD_REQUEST: {}, NOT_FOUND: {} })
      .input(
        z.object({
          phone: z.string().optional(),
          mobile: z.string().optional(),
        })
      )
      .output(
        z.object({
          success: z.boolean(),
          message: z.string(),
        })
      ),

    verifyOtp: oc
      .errors({ FORBIDDEN: {}, BAD_REQUEST: {}, NOT_FOUND: {}, UNAUTHORIZED: {} })
      .input(
        z.object({
          phone: z.string().optional(),
          mobile: z.string().optional(),
          code: z.string(),
        })
      )
      .output(
        z.object({
          token: z.string(),
          user: z.any().optional(),
          customer: z.any().optional(),
        })
      ),

    session: oc.output(
      z.object({
        user: z.any().nullable(),
      })
    ),

    logout: oc.output(
      z.object({
        success: z.boolean(),
      })
    ),

    customer: {
      requestOtp: oc
        .errors({ FORBIDDEN: {}, BAD_REQUEST: {}, NOT_FOUND: {} })
        .input(
          z.object({
            mobile: z.string().optional(),
            phone: z.string().optional(),
          })
        )
        .output(z.any()),
      verifyOtp: oc
        .errors({ FORBIDDEN: {}, BAD_REQUEST: {}, NOT_FOUND: {}, UNAUTHORIZED: {} })
        .input(
          z.object({
            mobile: z.string().optional(),
            phone: z.string().optional(),
            code: z.string(),
          })
        )
        .output(z.any()),
      me: oc.output(z.any()),
      logout: oc.output(z.any()),
    },

    staff: {
      login: oc.input(z.any()).output(z.any()),
      me: oc.output(z.any()),
      logout: oc.output(z.any()),
    },
  },

  catalog: {
    list: oc
      .input(
        z
          .object({
            search: z.string().optional(),
            categoryId: z.union([z.string(), z.number()]).optional(),
            brandId: z.union([z.string(), z.number()]).optional(),
            color: z.string().optional(),
            finish: z.string().optional(),
            grade: z.string().optional(),
            onlyActive: z.boolean().optional(),
            limit: z.number().default(50).optional(),
            page: z.number().default(1).optional(),
          })
          .optional()
      )
      .output(z.any()),

    getById: oc
      .input(
        z.object({
          id: z.union([z.string(), z.number()]),
        })
      )
      .output(z.any()),

    categories: oc
      .input(
        z
          .object({
            onlyActive: z.boolean().optional(),
          })
          .optional()
      )
      .output(z.any()),

    brands: oc
      .input(
        z
          .object({
            onlyActive: z.boolean().optional(),
          })
          .optional()
      )
      .output(z.any()),

    tags: oc
      .input(
        z
          .object({
            onlyActive: z.boolean().optional(),
          })
          .optional()
      )
      .output(z.any()),

    calculateCartons: oc
      .input(
        z.object({
          productId: z.string().optional(),
          requestedSqm: z.number().optional(),
          requestedArea: z.number().optional(),
          sqmPerCarton: z.number().optional(),
          pricePerSqm: z.number().optional(),
        })
      )
      .output(
        z.object({
          cartonCount: z.number(),
          deliverableArea: z.number(),
          totalPrice: z.number(),
        })
      ),
  },

  shopping: {
    all: oc
      .input(
        z
          .object({
            search: z.string().optional(),
            categoryId: z.union([z.string(), z.number()]).optional(),
            brandId: z.union([z.string(), z.number()]).optional(),
            limit: z.number().default(50).optional(),
            page: z.number().default(1).optional(),
          })
          .optional()
      )
      .output(z.any()),

    detail: oc
      .input(
        z.object({
          id: z.union([z.string(), z.number()]),
        })
      )
      .output(z.any()),

    categories: oc
      .input(
        z
          .object({
            onlyActive: z.boolean().optional(),
          })
          .optional()
      )
      .output(z.any()),

    brands: oc
      .input(
        z
          .object({
            onlyActive: z.boolean().optional(),
          })
          .optional()
      )
      .output(z.any()),

    tags: oc
      .input(
        z
          .object({
            onlyActive: z.boolean().optional(),
          })
          .optional()
      )
      .output(z.any()),

    calculateCartons: oc
      .input(
        z.object({
          productId: z.string().optional(),
          requestedSqm: z.number().optional(),
          requestedArea: z.number().optional(),
          sqmPerCarton: z.number().optional(),
          pricePerSqm: z.number().optional(),
        })
      )
      .output(
        z.object({
          cartonCount: z.number(),
          deliverableArea: z.number(),
          totalPrice: z.number(),
        })
      ),

    shippingMethods: oc.output(z.any()),

    cartProducts: oc
      .input(z.array(z.union([z.string(), z.number()])))
      .output(z.any()),

    addressList: oc
      .errors({ UNAUTHORIZED: {} })
      .output(z.any()),

    mutateAddress: oc
      .errors({ UNAUTHORIZED: {} })
      .input(
        z.object({
          id: z.string().optional(),
          title: z.string().optional(),
          province: z.string().optional(),
          city: z.string().optional(),
          postalCode: z.string().optional(),
          addressDetail: z.string().optional(),
        })
      )
      .output(z.any()),

    createOrder: oc
      .errors({ UNAUTHORIZED: {} })
      .input(z.any())
      .output(z.any()),

    verifyPayment: oc
      .errors({ BAD_REQUEST: {} })
      .input(z.any())
      .output(z.any()),
  },

  order: {
    all: oc
      .input(
        z
          .object({
            limit: z.number().default(100).optional(),
            page: z.number().default(1).optional(),
            status: z.string().optional(),
          })
          .optional()
      )
      .output(z.any()),

    list: oc
      .input(
        z
          .object({
            limit: z.number().default(100).optional(),
            page: z.number().default(1).optional(),
            status: z.string().optional(),
          })
          .optional()
      )
      .output(z.any()),

    summary: oc.output(
      z.object({
        total: z.number(),
        processing: z.number(),
        completed: z.number(),
      })
    ),

    detail: oc
      .errors({ NOT_FOUND: {} })
      .input(
        z.object({
          orderId: z.union([z.string(), z.number()]).optional(),
          id: z.union([z.string(), z.number()]).optional(),
        })
      )
      .output(z.any()),

    getById: oc
      .errors({ NOT_FOUND: {} })
      .input(
        z.object({
          id: z.union([z.string(), z.number()]),
        })
      )
      .output(z.any()),

    createCustomOrder: oc
      .input(
        z.object({
          productType: z.string().optional(),
          contentType: z.string().optional(),
          notes: z.string().optional(),
          details: z.any().optional(),
        })
      )
      .output(
        z.object({
          id: z.union([z.string(), z.number()]),
          message: z.string(),
        })
      ),

    submit: oc
      .errors({ UNAUTHORIZED: {} })
      .input(
        z.object({
          items: z.array(
            z.object({
              productId: z.union([z.string(), z.number()]),
              requestedArea: z.number().optional(),
              requestedSqm: z.number().optional(),
            })
          ),
          notes: z.string().optional(),
        })
      )
      .output(z.any()),

    cancel: oc
      .input(
        z.object({
          id: z.union([z.string(), z.number()]),
          reason: z.string().optional(),
        })
      )
      .output(z.any()),

    prepareReorder: oc
      .input(
        z.object({
          id: z.union([z.string(), z.number()]),
        })
      )
      .output(z.any()),

    pricing: {
      validateCart: oc
        .input(
          z.object({
            items: z.array(
              z.object({
                productId: z.union([z.string(), z.number()]),
                requestedSqm: z.number().optional(),
                requestedArea: z.number().optional(),
              })
            ),
          })
        )
        .output(z.any()),
    },

    staffList: oc
      .input(
        z
          .object({
            status: z.string().optional(),
            customerId: z.string().optional(),
            search: z.string().optional(),
            page: z.number().optional(),
            limit: z.number().optional(),
          })
          .optional()
      )
      .output(z.any()),

    staffUpdateStatus: oc
      .input(
        z.object({
          id: z.union([z.string(), z.number()]),
          newStatus: z.string(),
          note: z.string().optional(),
        })
      )
      .output(z.any()),

    staffCancel: oc
      .input(
        z.object({
          id: z.union([z.string(), z.number()]),
          cancellationReason: z.string().optional(),
          cancellationNote: z.string().optional(),
        })
      )
      .output(z.any()),
  },

  customer: {
    profile: oc.output(z.any()),
    updateProfile: oc
      .input(
        z.object({
          contactName: z.string().optional(),
          storeName: z.string().optional(),
          nationalCode: z.string().optional(),
          economicCode: z.string().optional(),
          province: z.string().optional(),
          city: z.string().optional(),
          address: z.string().optional(),
        })
      )
      .output(z.any()),
  },

  user: {
    profile: oc.errors({ UNAUTHORIZED: {} }).output(z.any()),

    list: oc
      .input(
        z
          .object({
            limit: z.number().optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .output(z.any()),

    update: oc
      .errors({ UNAUTHORIZED: {}, FORBIDDEN: {}, BAD_REQUEST: {} })
      .input(
        z.object({
          fullName: z.string().optional(),
          companyName: z.string().optional(),
          nationalCode: z.string().optional(),
          economicCode: z.string().optional(),
          province: z.string().optional(),
          city: z.string().optional(),
          address: z.string().optional(),
          addresses: z.any().optional(),
        })
      )
      .output(z.any()),
  },

  system: {
    csvImport: {
      preview: oc
        .input(
          z.object({
            filename: z.string(),
            csvContent: z.string(),
          })
        )
        .output(z.any()),
      apply: oc
        .input(
          z.object({
            importRunId: z.string(),
          })
        )
        .output(z.any()),
      listRuns: oc
        .input(
          z
            .object({
              page: z.number().optional(),
              limit: z.number().optional(),
            })
            .optional()
        )
        .output(z.any()),
    },

    audit: {
      list: oc
        .input(
          z
            .object({
              action: z.any().optional(),
              entityType: z.string().optional(),
              page: z.number().optional(),
              limit: z.number().optional(),
            })
            .optional()
        )
        .output(z.any()),
    },
  },

  plan: {
    list: oc
      .input(
        z
          .object({
            status: z.enum(['active', 'expired', 'draft']).optional(),
            userId: z.union([z.number(), z.string()]).optional(),
            page: z.number().optional(),
            limit: z.number().optional(),
          })
          .optional()
      )
      .output(
        z.object({
          items: z.array(z.any()),
          total: z.number(),
        })
      ),

    getById: oc
      .errors({ NOT_FOUND: {} })
      .input(z.object({ id: z.union([z.number(), z.string()]) }))
      .output(z.any()),

    create: oc
      .input(
        z.object({
          title: z.string().optional(),
          users: z.array(z.union([z.number(), z.string()])).min(1, 'حداقل یک کاربر باید انتخاب شود'),
          content: z.string().min(1, 'متن پیام الزامی است'),
          type: z.enum(['credit_terms', 'product_discount']).default('credit_terms').optional(),
          discountPercent: z.number().optional(),
          discountAmount: z.number().optional(),
          status: z.enum(['active', 'expired', 'draft']).default('active'),
          products: z.array(z.union([z.number(), z.string()])).optional(),
          expiresAt: z.string().optional(),
        })
      )
      .output(z.any()),

    update: oc
      .input(
        z.object({
          id: z.union([z.number(), z.string()]),
          title: z.string().optional(),
          users: z.array(z.union([z.number(), z.string()])).optional(),
          content: z.string().optional(),
          type: z.enum(['credit_terms', 'product_discount']).optional(),
          discountPercent: z.number().optional(),
          discountAmount: z.number().optional(),
          status: z.enum(['active', 'expired', 'draft']).optional(),
          products: z.array(z.union([z.number(), z.string()])).optional(),
          expiresAt: z.string().optional(),
        })
      )
      .output(z.any()),
  },
}

export type AppContract = typeof contract

import { oc } from '@orpc/contract'
import { openapi } from '@orpc/openapi'
import { z } from 'zod'
import {
  EntityIdSchema,
  IranianMobileSchema,
  StandardErrorDataSchema,
} from './common'
import { CustomerProfileSchema } from './customer'

export const StaffRoleSchema = z.enum(['admin', 'support'])
export type StaffRole = z.infer<typeof StaffRoleSchema>

export const StaffProfileSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1, 'نام الزامی است'),
  mobile: IranianMobileSchema.optional(),
  email: z.string().email('ایمیل نامعتبر است').optional(),
  role: StaffRoleSchema,
  isActive: z.boolean().default(true).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type StaffProfile = z.infer<typeof StaffProfileSchema>

export const RequestOtpInputSchema = z.object({
  mobile: IranianMobileSchema.optional(),
  phone: z.string().optional(),
})

export type RequestOtpInput = z.infer<typeof RequestOtpInputSchema>

export const RequestOtpOutputSchema = z.object({
  success: z.boolean(),
  cooldownSeconds: z.number().int().positive().optional(),
  expiresInSeconds: z.number().int().positive().optional(),
  message: z.string().optional(),
})

export type RequestOtpOutput = z.infer<typeof RequestOtpOutputSchema>

export const VerifyOtpInputSchema = z.object({
  mobile: IranianMobileSchema.optional(),
  phone: z.string().optional(),
  code: z
    .string()
    .trim()
    .min(4, 'کد تایید حداقل ۴ رقم است')
    .max(6, 'کد تایید حداکثر ۶ رقم است'),
})

export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>

export const CustomerAuthResponseSchema = z.object({
  token: z.string(),
  customer: CustomerProfileSchema.optional(),
  user: z.any().optional(),
})

export type CustomerAuthResponse = z.infer<typeof CustomerAuthResponseSchema>

export const StaffLoginInputSchema = z.object({
  identifier: z.string().trim().min(1, 'نام کاربری/موبایل/ایمیل الزامی است'),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر است'),
})

export type StaffLoginInput = z.infer<typeof StaffLoginInputSchema>

export const StaffAuthResponseSchema = z.object({
  token: z.string(),
  staff: StaffProfileSchema,
})

export type StaffAuthResponse = z.infer<typeof StaffAuthResponseSchema>

export const authContract = {
  requestOtp: oc
    .meta(openapi({ method: 'POST', path: '/auth/request-otp', summary: 'درخواست کد یکبار مصرف پیامکی' }))
    .input(RequestOtpInputSchema)
    .output(RequestOtpOutputSchema)
    .errors({
      FORBIDDEN: { data: StandardErrorDataSchema },
      BAD_REQUEST: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
    }),

  verifyOtp: oc
    .meta(openapi({ method: 'POST', path: '/auth/verify-otp', summary: 'بررسی کد یکبار مصرف و ورود' }))
    .input(VerifyOtpInputSchema)
    .output(CustomerAuthResponseSchema.or(z.any()))
    .errors({
      FORBIDDEN: { data: StandardErrorDataSchema },
      BAD_REQUEST: { data: StandardErrorDataSchema },
      NOT_FOUND: { data: StandardErrorDataSchema },
      UNAUTHORIZED: { data: StandardErrorDataSchema },
    }),

  session: oc
    .meta(openapi({ method: 'GET', path: '/auth/session', summary: 'وضعیت نشست کاربر جاری' }))
    .output(
      z.object({
        user: z.any().nullable(),
      })
    ),

  logout: oc
    .meta(openapi({ method: 'POST', path: '/auth/logout', summary: 'خروج از حساب کاربری' }))
    .output(
      z.object({
        success: z.boolean(),
      })
    ),

  customer: {
    requestOtp: oc
      .meta(openapi({ method: 'POST', path: '/auth/customer/request-otp', summary: 'درخواست کد یکبار مصرف پیامکی مشتری' }))
      .input(RequestOtpInputSchema)
      .output(RequestOtpOutputSchema)
      .errors({
        ACCOUNT_INACTIVE: {},
        NOT_FOUND: {},
        TOO_MANY_ATTEMPTS: {},
        FORBIDDEN: {},
        BAD_REQUEST: {},
      }),

    verifyOtp: oc
      .meta(openapi({ method: 'POST', path: '/auth/customer/verify-otp', summary: 'بررسی کد یکبار مصرف و ورود مشتری' }))
      .input(VerifyOtpInputSchema)
      .output(CustomerAuthResponseSchema.or(z.any()))
      .errors({
        OTP_INVALID: {},
        OTP_EXPIRED: {},
        ACCOUNT_INACTIVE: {},
        TOO_MANY_ATTEMPTS: {},
        FORBIDDEN: {},
        BAD_REQUEST: {},
        NOT_FOUND: {},
        UNAUTHORIZED: {},
      }),

    me: oc
      .meta(openapi({ method: 'GET', path: '/auth/customer/me', summary: 'بررسی وضعیت نشست جاری مشتری' }))
      .output(CustomerProfileSchema.or(z.any()).nullable())
      .errors({
        UNAUTHORIZED: {},
      }),

    logout: oc
      .meta(openapi({ method: 'POST', path: '/auth/customer/logout', summary: 'خروج مشتری' }))
      .output(
        z.object({
          success: z.boolean(),
        }).or(z.any())
      ),
  },

  staff: {
    login: oc
      .meta(openapi({ method: 'POST', path: '/auth/staff/login', summary: 'ورود پرسنل داخلی (ادمین یا پشتیبان)' }))
      .input(StaffLoginInputSchema.or(z.any()))
      .output(StaffAuthResponseSchema.or(z.any()))
      .errors({
        INVALID_CREDENTIALS: {},
        ACCOUNT_INACTIVE: {},
      }),

    me: oc
      .meta(openapi({ method: 'GET', path: '/auth/staff/me', summary: 'بررسی وضعیت نشست جاری پرسنل داخلی' }))
      .output(StaffProfileSchema.or(z.any()))
      .errors({
        UNAUTHORIZED: {},
        FORBIDDEN: {},
      }),

    logout: oc
      .meta(openapi({ method: 'POST', path: '/auth/staff/logout', summary: 'خروج پرسنل' }))
      .output(
        z.object({
          success: z.boolean(),
        }).or(z.any())
      ),
  },
}

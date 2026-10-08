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
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type StaffProfile = z.infer<typeof StaffProfileSchema>

export const RequestOtpInputSchema = z.object({
  mobile: IranianMobileSchema,
})

export type RequestOtpInput = z.infer<typeof RequestOtpInputSchema>

export const RequestOtpOutputSchema = z.object({
  success: z.boolean(),
  cooldownSeconds: z.number().int().positive(),
  expiresInSeconds: z.number().int().positive(),
  message: z.string().optional(),
})

export type RequestOtpOutput = z.infer<typeof RequestOtpOutputSchema>

export const VerifyOtpInputSchema = z.object({
  mobile: IranianMobileSchema,
  code: z
    .string()
    .trim()
    .min(4, 'کد تایید حداقل ۴ رقم است')
    .max(6, 'کد تایید حداکثر ۶ رقم است')
    .regex(/^[0-9]+$/, 'کد تایید باید فقط شامل ارقام باشد'),
})

export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>

export const CustomerAuthResponseSchema = z.object({
  token: z.string(),
  customer: CustomerProfileSchema,
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
  customer: {
    requestOtp: oc
      .meta(openapi({ method: 'POST', path: '/auth/customer/request-otp', summary: 'درخواست کد یکبار مصرف پیامکی مشتری' }))
      .input(RequestOtpInputSchema)
      .output(RequestOtpOutputSchema)
      .errors({
        ACCOUNT_INACTIVE: { data: StandardErrorDataSchema },
        NOT_FOUND: { data: StandardErrorDataSchema },
        TOO_MANY_ATTEMPTS: { data: z.object({ message: z.string(), retryAfterSeconds: z.number().optional() }) },
      }),

    verifyOtp: oc
      .meta(openapi({ method: 'POST', path: '/auth/customer/verify-otp', summary: 'بررسی کد یکبار مصرف و ورود مشتری' }))
      .input(VerifyOtpInputSchema)
      .output(CustomerAuthResponseSchema)
      .errors({
        OTP_INVALID: { data: StandardErrorDataSchema },
        OTP_EXPIRED: { data: StandardErrorDataSchema },
        ACCOUNT_INACTIVE: { data: StandardErrorDataSchema },
        TOO_MANY_ATTEMPTS: { data: StandardErrorDataSchema },
      }),

    me: oc
      .meta(openapi({ method: 'GET', path: '/auth/customer/me', summary: 'بررسی وضعیت نشست جاری مشتری' }))
      .output(CustomerProfileSchema)
      .errors({
        UNAUTHORIZED: { data: StandardErrorDataSchema },
      }),
  },

  staff: {
    login: oc
      .meta(openapi({ method: 'POST', path: '/auth/staff/login', summary: 'ورود پرسنل داخلی (ادمین یا پشتیبان)' }))
      .input(StaffLoginInputSchema)
      .output(StaffAuthResponseSchema)
      .errors({
        INVALID_CREDENTIALS: { data: StandardErrorDataSchema },
        ACCOUNT_INACTIVE: { data: StandardErrorDataSchema },
      }),

    me: oc
      .meta(openapi({ method: 'GET', path: '/auth/staff/me', summary: 'بررسی وضعیت نشست جاری پرسنل داخلی' }))
      .output(StaffProfileSchema)
      .errors({
        UNAUTHORIZED: { data: StandardErrorDataSchema },
        FORBIDDEN: { data: StandardErrorDataSchema },
      }),
  },
}

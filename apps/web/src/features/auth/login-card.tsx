
import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { InputOTP, Button } from '@heroui/react'

import { useAuth } from './auth-store'
import { toast } from '../../components/feedback/toast'
import {
  PhoneIcon,
  ArrowLeftIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  PencilIcon,
  ShieldCheckIcon,
  LockIcon,
} from '../../components/ui/icons'
import { toPersianDigits } from '../../lib/utils/currency'

export function LoginCard() {
  const navigate = useNavigate()
  const { sendOtp, verifyOtp } = useAuth()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(120)

  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [step, countdown])

  const handleSendPhone = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setErrorMessage(null)

    const cleaned = phone.trim()

    if (!/^09\d{9}$/.test(cleaned)) {
      setErrorMessage(
        'لطفاً شماره موبایل معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد نمایید.',
      )
      return
    }

    setIsLoading(true)

    try {
      await sendOtp(cleaned)

      setStep('otp')
      setCountdown(120)
      setOtpCode('')

      toast.info(
        'کد تأیید ارسال شد',
        `پیامک حاوی کد تأیید ۵ رقمی برای شماره ${toPersianDigits(cleaned)} ارسال گردید.`,
      )
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'خطا در ارسال کد اعتبارسنجی'

      setErrorMessage(msg)
      toast.error('خطای ورود', msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify ?? otpCode).trim()
    setErrorMessage(null)

    if (!/^\d{5}$/.test(code)) {
      setErrorMessage('کد تأیید یکبار مصرف باید ۵ رقم باشد.')
      return
    }

    setIsLoading(true)

    try {
      await verifyOtp(code)

      toast.success(
        'ورود موفقیت‌آمیز',
        'به سامانه سفارش‌گذاری عمده پرشین‌پارت خوش آمدید.',
      )

      const search = new URLSearchParams(window.location.search)
      const redirectUrl = search.get('redirect')

      if (redirectUrl && !redirectUrl.includes('/login')) {
        try {
          const url = new URL(redirectUrl, window.location.origin)

          if (url.origin !== window.location.origin) {
            navigate({ to: '/product' })
            return
          }

          navigate({
            to: url.pathname as any,
            search: Object.fromEntries(url.searchParams.entries()) as any,
          })
        } catch {
          navigate({ to: '/product' })
        }
      } else {
        navigate({ to: '/product' })
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'کد تأیید وارد شده نادرست یا منقضی است.'

      setErrorMessage(msg)
      toast.error('خطای ورود', msg)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60

    return toPersianDigits(
      `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.5, ease: 'backInOut' }}
      className="mb-5 w-full overflow-hidden"
    >
      <div className="w-full rounded-3xl bg-primary/3 p-6 sm:p-8">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 p-2.5 shadow-xs">
            <img
              src="/assets/images/persian-part-logo.png"
              alt="پرشین‌پارت"
              className="size-10 object-contain"
            />
          </div>

          <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
            ورود به پرشین‌پارت
          </h1>

          <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted">
            سامانه هوشمند استعلام قیمت و سفارش‌گذاری عمده کاشی و سرامیک پرسلان
          </p>
        </div>

        {/* Inline Error Message */}
        <AnimatePresence initial={false}>
          {errorMessage && (
            <motion.div
              key="login-error"
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 rounded-2xl border border-danger/20 bg-danger/10 p-3.5 text-xs font-semibold text-danger">
                <AlertCircleIcon
                  size={18}
                  className="mt-0.5 shrink-0 text-danger"
                />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Transition */}
        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.form
              key="step-phone"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onSubmit={handleSendPhone}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="phone-input"
                  className="mb-2 block text-start text-xs font-bold text-foreground/80"
                >
                  شماره تلفن همراه
                </label>

                <div className="relative flex items-center rounded-2xl border border-border/50 bg-muted/10 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                  <span className="pointer-events-none flex items-center justify-center ps-3.5 pe-1 text-muted">
                    <PhoneIcon size={18} />
                  </span>

                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phone}
                    onChange={(e) => {
                      const cleaned = e.target.value
                        .replace(/[۰-۹]/g, (d) =>
                          String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),
                        )
                        .replace(/[٠-٩]/g, (d) =>
                          String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)),
                        )
                        .replace(/\D/g, '')
                        .slice(0, 11)

                      setPhone(cleaned)
                    }}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    dir="ltr"
                    autoFocus
                    disabled={isLoading}
                    className="h-12 flex-1 bg-transparent px-2 text-start text-base font-bold tracking-widest text-foreground outline-hidden placeholder:text-sm sm:text-lg"
                  />

                  <span className="select-none pe-3.5 text-xs font-bold text-muted/70">
                    ۹۸+
                  </span>
                </div>

                <p className="mt-2 text-start text-xs font-medium leading-relaxed text-muted">
                  کد یکبار مصرف تأیید ورود از طریق پیامک برای این شماره ارسال خواهد شد.
                </p>
              </div>

              <Button
                type="submit"
                isDisabled={isLoading || !/^09\d{9}$/.test(phone)}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40"
              >
                {isLoading ? (
                  <RefreshCwIcon size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>دریافت کد تأیید</span>
                    <ArrowLeftIcon size={16} />
                  </>
                )}
              </Button>
            </motion.form>
          ) : (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-4"
            >
              {/* Phone Info */}
              <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/10 p-3">
                <div className="text-start">
                  <span className="block text-xs text-muted">
                    کد تأیید ارسال شد به:
                  </span>

                  <span
                    className="text-sm font-extrabold tracking-wider text-foreground"
                    dir="ltr"
                  >
                    {toPersianDigits(phone)}
                  </span>
                </div>

                <Button
                  type="button"
                  onPress={() => {
                    setStep('phone')
                    setErrorMessage(null)
                  }}
                  isDisabled={isLoading}
                  className="flex h-8 cursor-pointer items-center gap-1 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
                >
                  <PencilIcon size={14} />
                  <span>ویرایش شماره</span>
                </Button>
              </div>

              {/* OTP Inputs */}
              <div>
                <label className="mb-2.5 block text-start text-xs font-bold text-foreground/80">
                  کد تأیید ۵ رقمی پیامک‌شده
                </label>

                <div
                  className="flex w-full items-center justify-center py-1"
                  dir="ltr"
                >
                  <InputOTP
                    maxLength={5}
                    value={otpCode}
                    onChange={setOtpCode}
                    onComplete={(code) => handleVerifyOtp(code)}
                    isDisabled={isLoading}
                    autoFocus
                  >
                    <InputOTP.Group className="flex justify-center gap-2 sm:gap-2.5">
                      {Array.from({ length: 5 }, (_, index) => (
                        <InputOTP.Slot
                          key={index}
                          index={index}
                          className="size-12 rounded-2xl border border-border/50 bg-muted/15 text-xl font-bold text-foreground sm:size-14"
                        />
                      ))}
                    </InputOTP.Group>
                  </InputOTP>
                </div>
              </div>

              {/* Timer and Resend */}
              <div className="flex items-center justify-between pt-1 text-xs">
                {countdown > 0 ? (
                  <span className="font-medium text-muted">
                    امکان ارسال مجدد تا:{' '}
                    <strong className="font-bold text-foreground">
                      {formatTimer(countdown)}
                    </strong>
                  </span>
                ) : (
                  <Button
                    type="button"
                    onPress={() => handleSendPhone()}
                    isDisabled={isLoading}
                    className="flex h-auto min-w-0 cursor-pointer items-center gap-1.5 bg-transparent p-0 text-xs font-bold text-primary hover:opacity-80"
                  >
                    <RefreshCwIcon size={14} />
                    <span>ارسال مجدد پیامک کد</span>
                  </Button>
                )}
              </div>

              <Button
                type="button"
                onPress={() => handleVerifyOtp()}
                isDisabled={isLoading || otpCode.length !== 5}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40"
              >
                {isLoading ? (
                  <RefreshCwIcon size={18} className="animate-spin" />
                ) : (
                  <>
                    <LockIcon size={16} />
                    <span>تأیید و ورود به پنل</span>
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer B2B Notice */}
        <div className="mt-7 border-t border-border/40 pt-4 text-center">
          <div className="mb-1 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheckIcon
              size={14}
              className="shrink-0 text-primary/70"
            />
            <span>
              افتتاح حساب مشتریان جدید منحصراً توسط مدیریت انجام می‌شود.
            </span>
          </div>

          <p className="text-xs text-muted/70">
            پشتیبانی امور نمایندگان:{' '}
            <span
              className="font-bold text-foreground/80"
              dir="ltr"
            >
              ۰۲۱-۸۸۸۸۸۸۸۸
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

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

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [step, countdown])

  const handleSendPhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    const cleaned = phone.trim()
    if (!cleaned || cleaned.length < 10) {
      setErrorMessage('لطفاً شماره موبایل معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد نمایید.')
      return
    }

    setIsLoading(true)
    try {
      await sendOtp(cleaned)
      setStep('otp')
      setCountdown(120)
      setOtpCode('')
      toast.info('کد تأیید ارسال شد', `پیامک حاوی کد تأیید ۵ رقمی برای شماره ${toPersianDigits(cleaned)} ارسال گردید.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در ارسال کد اعتبارسنجی'
      setErrorMessage(msg)
      toast.error('خطای ورود', msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim()
    setErrorMessage(null)

    if (!code || code.length !== 5) {
      setErrorMessage('کد تأیید یکبار مصرف باید ۵ رقم باشد.')
      return
    }

    setIsLoading(true)
    try {
      await verifyOtp(code)
      toast.success('ورود موفقیت‌آمیز', 'به سامانه سفارش‌گذاری عمده پرشین‌پارت خوش آمدید.')

      const search = new URLSearchParams(window.location.search)
      const redirectUrl = search.get('redirect')
      if (redirectUrl && !redirectUrl.includes('/login')) {
        try {
          const url = new URL(redirectUrl, window.location.origin)
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
      const msg = err instanceof Error ? err.message : 'کد تایید وارد شده نادرست یا منقضی است.'
      setErrorMessage(msg)
      toast.error('خطای ورود', msg)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${toPersianDigits(mins.toString().padStart(2, '0'))}:${toPersianDigits(secs.toString().padStart(2, '0'))}`
  }

  return (
    <div className="w-full bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-lg transition-all">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 p-2.5 shadow-xs">
          <img
            src="/assets/images/persian-part-logo.png"
            alt="پرشین‌پارت"
            className="size-10 object-contain"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          ورود به پرشین‌پارت
        </h1>
        <p className="text-xs text-muted leading-relaxed mt-1.5 max-w-xs">
          سامانه هوشمند استعلام قیمت و سفارش‌گذاری عمده کاشی و سرامیک پرسلان
        </p>
      </div>

      {/* Inline Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mb-5 overflow-hidden"
          >
            <div className="p-3.5 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold flex items-start gap-2.5">
              <AlertCircleIcon size={18} className="shrink-0 text-danger mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Transition Wrapper */}
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
                className="block text-xs font-bold text-foreground/80 mb-2 text-start"
              >
                شماره تلفن همراه
              </label>
              <div className="relative flex items-center bg-muted/10 border border-border/50 rounded-2xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <span className="ps-3.5 pe-1 text-muted pointer-events-none flex items-center justify-center">
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
                      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
                      .replace(/\D/g, '')
                      .slice(0, 11)
                    setPhone(cleaned)
                  }}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  dir="ltr"
                  autoFocus
                  disabled={isLoading}
                  className="flex-1 h-12 bg-transparent px-2 placeholder:text-sm text-foreground font-bold tracking-widest text-base sm:text-lg text-start outline-hidden"
                />
                <span className="pe-3.5 text-xs font-bold text-muted/70 select-none">
                  ۹۸+
                </span>
              </div>
              <p className="text-xs text-muted font-medium mt-2 text-start leading-relaxed">
                کد یکبار مصرف تأیید ورود از طریق پیامک برای این شماره ارسال خواهد شد.
              </p>
            </div>

            <Button
              type="submit"
              isDisabled={isLoading || phone.length < 10}
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-40"
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
            {/* Phone Info Strip */}
            <div className="p-3 bg-muted/10 border border-border/40 rounded-2xl flex items-center justify-between">
              <div className="text-start">
                <span className="text-xs text-muted block">کد تأیید ارسال شد به:</span>
                <span className="text-sm font-extrabold text-foreground tracking-wider" dir="ltr">
                  {toPersianDigits(phone)}
                </span>
              </div>
              <Button
                type="button"
                onPress={() => {
                  setStep('phone')
                  setErrorMessage(null)
                }}
                className="text-xs font-bold text-primary hover:opacity-80 flex items-center gap-1 cursor-pointer bg-primary/10 hover:bg-primary/15 h-8 px-3 rounded-xl transition-colors"
              >
                <PencilIcon size={14} />
                <span>ویرایش شماره</span>
              </Button>
            </div>

            {/* OTP Inputs */}
            <div>
              <label className="block text-xs font-bold text-foreground/80 mb-2.5 text-start">
                کد تأیید ۵ رقمی پیامک‌شده
              </label>
              <div className="flex w-full justify-center items-center py-1" dir="ltr">
                <InputOTP
                  maxLength={5}
                  value={otpCode}
                  onChange={setOtpCode}
                  onComplete={(code) => handleVerifyOtp(code)}
                  isDisabled={isLoading}
                  autoFocus
                >
                  <InputOTP.Group className="gap-2 sm:gap-2.5 flex justify-center">
                    <InputOTP.Slot
                      index={0}
                      className="size-12 sm:size-14 text-xl font-bold rounded-2xl bg-muted/15 border border-border/50 text-foreground"
                    />
                    <InputOTP.Slot
                      index={1}
                      className="size-12 sm:size-14 text-xl font-bold rounded-2xl bg-muted/15 border border-border/50 text-foreground"
                    />
                    <InputOTP.Slot
                      index={2}
                      className="size-12 sm:size-14 text-xl font-bold rounded-2xl bg-muted/15 border border-border/50 text-foreground"
                    />
                    <InputOTP.Slot
                      index={3}
                      className="size-12 sm:size-14 text-xl font-bold rounded-2xl bg-muted/15 border border-border/50 text-foreground"
                    />
                    <InputOTP.Slot
                      index={4}
                      className="size-12 sm:size-14 text-xl font-bold rounded-2xl bg-muted/15 border border-border/50 text-foreground"
                    />
                  </InputOTP.Group>
                </InputOTP>
              </div>
            </div>

            {/* Timer and Resend Action */}
            <div className="flex items-center justify-between text-xs pt-1">
              {countdown > 0 ? (
                <span className="text-muted font-medium">
                  امکان ارسال مجدد تا:{' '}
                  <strong className="text-foreground font-bold">{formatTimer(countdown)}</strong>
                </span>
              ) : (
                <Button
                  type="button"
                  onPress={() => handleSendPhone()}
                  isDisabled={isLoading}
                  className="text-primary hover:opacity-80 font-bold flex items-center gap-1.5 cursor-pointer text-xs bg-transparent h-auto p-0 min-w-0"
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
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-40"
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
      <div className="mt-7 pt-4 border-t border-border/40 text-center">
        <div className="flex items-center justify-center gap-1.5 text-muted text-xs mb-1">
          <ShieldCheckIcon size={14} className="text-primary/70 shrink-0" />
          <span>افتتاح حساب مشتریان جدید منحصراً توسط مدیریت انجام می‌شود.</span>
        </div>
        <p className="text-xs text-muted/70">
          پشتیبانی امور نمایندگان: <span className="font-bold text-foreground/80" dir="ltr">۰۲۱-۸۸۸۸۸۸۸۸</span>
        </p>
      </div>
    </div>
  )
}

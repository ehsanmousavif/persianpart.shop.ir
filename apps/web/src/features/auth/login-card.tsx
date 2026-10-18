import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { InputOTP } from '@heroui/react'
import { useAuth } from './auth-store'
import { toast } from '../../components/feedback/toast'
import { PhoneIcon, ArrowLeftIcon, RefreshCwIcon, AlertCircleIcon } from '../../components/ui/icons'
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

    if (!phone || phone.length < 10) {
      setErrorMessage('لطفاً شماره موبایل معتبر ۱۱ رقمی وارد نمایید.')
      return
    }

    setIsLoading(true)
    try {
      await sendOtp(phone)
      setStep('otp')
      setCountdown(120)
      setOtpCode('')
      toast.info('کد تأیید ارسال شد', `پیامک حاوی کد تأیید برای شماره ${toPersianDigits(phone)} ارسال شد.`)
    } catch (err: any) {
      const msg = err.message || 'خطا در ارسال کد اعتبارسنجی'
      setErrorMessage(msg)
      toast.error('خطای ارتباط با سرور', msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode
    setErrorMessage(null)

    if (!code || code.length !== 5) {
      setErrorMessage('کد تأیید باید ۵ رقم باشد.')
      return
    }

    setIsLoading(true)
    try {
      await verifyOtp(code)
      toast.success('ورود موفقیت‌آمیز', 'خوش‌آمدید به سامانه سفارش‌گذاری پرشین‌پارت')
      
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
    <div className="w-full bg-surface rounded-2xl  py-4 p-4 max-w-2xl flex flex-col gap-2">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold text-primary text-center">
        ورود به حساب کاربری
        </h2>
        <p className="text-base text-primary/70 mt-3 leading-relaxed text-right">
          پرشین‌پارت؛ مرجع تخصصی تأمین و سفارش کاشی و سرامیک، با دسترسی به محصولات، قیمت‌گذاری شفاف و مدیریت آسان سفارش‌ها.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm flex items-start gap-2 animate-in fade-in">
          <AlertCircleIcon size={18} className="shrink-0 text-danger mt-0.5" />
          <span className="leading-relaxed font-medium">{errorMessage}</span>
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendPhone} className="space-y-3.5">
          <div>
            <label htmlFor="phone" className="block text-primary/80 text-sm font-bold mb-1.5 text-right">
              شماره همراه:
            </label>
            <div className="relative">
              <input
                id="phone"
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
                className="w-full h-12 px-4 rounded-xl border border-border bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground font-bold tracking-wider text-lg text-start transition-all outline-hidden"
                disabled={isLoading}
              />
              <PhoneIcon size={18} className="absolute start-4 top-4 text-muted pointer-events-none" />
            </div>
            <p className="text-sm text-primary/80 font-semibold mt-1.5 text-right leading-relaxed">
              کد تأیید به این شماره ارسال می‌شود.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 active:scale-98 text-primary-foreground font-bold text-base flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCwIcon className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>دریافت کد تأیید ورود</span>
                <ArrowLeftIcon size={16} />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-default/15 border border-border rounded-xl flex items-center justify-between">
            <div className="text-right">
              <span className="text-sm text-muted block">ارسال کد به شماره:</span>
              <span className="text-base font-extrabold text-foreground" dir="ltr">
                {toPersianDigits(phone)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setErrorMessage(null)
              }}
              className="text-sm font-bold text-primary hover:opacity-80 cursor-pointer"
            >
              ویرایش شماره
            </button>
          </div>

          <div className="w-full">
            <label className="block text-sm font-bold text-foreground mb-2.5 text-right">
              کد تأیید ۵ رقمی:
            </label>
            <div className="flex w-full justify-center items-center py-1" dir="ltr">
              <InputOTP
                maxLength={5}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => handleVerifyOtp(code)}
                isDisabled={isLoading}
                className="w-full max-w-[300px]"
                autoFocus
              >
                <InputOTP.Group className="gap-2 sm:gap-2.5 flex justify-center">
                  <InputOTP.Slot index={0} className="size-15 text-xl font-bold rounded-xl border border-border bg-surface text-foreground" />
                  <InputOTP.Slot index={1} className="size-15 text-xl font-bold rounded-xl border border-border bg-surface text-foreground" />
                  <InputOTP.Slot index={2} className="size-15 text-xl font-bold rounded-xl border border-border bg-surface text-foreground" />
                  <InputOTP.Slot index={3} className="size-15 text-xl font-bold rounded-xl border border-border bg-surface text-foreground" />
                  <InputOTP.Slot index={4} className="size-15 text-xl font-bold rounded-xl border border-border bg-surface text-foreground" />
                </InputOTP.Group>
              </InputOTP>
            </div>
          </div>

          {/* Timer and Resend */}
          <div className="flex items-center justify-between text-sm">
            {countdown > 0 ? (
              <span className="text-muted font-medium">
                ارسال مجدد تا: <strong className="text-foreground">{formatTimer(countdown)}</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendPhone()}
                className="text-primary hover:opacity-80 font-bold flex items-center gap-1 cursor-pointer text-sm"
              >
                <RefreshCwIcon size={14} />
                <span>ارسال مجدد کد</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleVerifyOtp()}
            disabled={isLoading || otpCode.length !== 5}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground font-bold text-base flex items-center justify-center gap-2 transition-allcursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCwIcon className="w-5 h-5 animate-spin" />
            ) : (
              <span>تأیید و ورود به سامانه</span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

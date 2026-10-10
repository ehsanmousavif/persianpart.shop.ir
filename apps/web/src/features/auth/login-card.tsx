import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { InputOTP } from '@heroui/react'
import { useAuth } from './auth-store'
import { toast } from '../../components/feedback/toast'
import { PhoneIcon, ArrowLeftIcon, RefreshCwIcon, AlertCircleIcon, ShieldCheckIcon } from '../../components/ui/icons'
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
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
          <ShieldCheckIcon size={22} />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          ورود همکاران و خریداران B2B
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          سامانه سفارش‌گذاری سریع محصولات پرشین‌پارت
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircleIcon size={16} className="shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-relaxed font-medium">{errorMessage}</span>
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendPhone} className="space-y-3.5">
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-slate-700 mb-1.5 text-start">
              شماره تلفن همراه:
            </label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                dir="ltr"
                className="w-full h-11 px-3.5 ps-10 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-bold tracking-wider text-base text-start transition-all outline-hidden"
                disabled={isLoading}
              />
              <PhoneIcon size={18} className="absolute start-3 top-3 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 text-start leading-relaxed">
              کد اعتبارسنجی یکبارمصرف به این شماره پیامک خواهد شد.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCwIcon className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>دریافت کد تأیید ورود</span>
                <ArrowLeftIcon size={15} />
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="text-start">
              <span className="text-xs text-slate-500 block">ارسال کد به شماره:</span>
              <span className="text-sm font-extrabold text-slate-900" dir="ltr">
                {toPersianDigits(phone)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setErrorMessage(null)
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            >
              ویرایش شماره
            </button>
          </div>

          <div className="w-full">
            <label className="block text-xs font-bold text-slate-700 mb-2.5 text-start">
              کد تأیید ۵ رقمی:
            </label>
            <div className="flex  w-full justify-center items-center py-1" dir="ltr">
              <InputOTP
                maxLength={5}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => handleVerifyOtp(code)}
                isDisabled={isLoading}
                className="w-full max-w-[300px] "
                autoFocus
              >
                <InputOTP.Group className="gap-2 sm:gap-2.5 flex justify-center">
                  <InputOTP.Slot index={0} className="size-15 text-xl font-bold rounded-xl border border-slate-300" />
                  <InputOTP.Slot index={1} className="size-15 text-xl font-bold rounded-xl border border-slate-300" />
                  <InputOTP.Slot index={2} className="size-15 text-xl font-bold rounded-xl border border-slate-300" />
                  <InputOTP.Slot index={3} className="size-15 text-xl font-bold rounded-xl border border-slate-300" />
                  <InputOTP.Slot index={4} className="size-15 text-xl font-bold rounded-xl border border-slate-300" />
                </InputOTP.Group>
              </InputOTP>
            </div>
          </div>

          {/* Timer and Resend */}
          <div className="flex items-center justify-between text-xs">
            {countdown > 0 ? (
              <span className="text-slate-500 font-medium">
                ارسال مجدد تا: <strong className="text-slate-800">{formatTimer(countdown)}</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendPhone()}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
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
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
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

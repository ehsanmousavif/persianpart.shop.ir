import React, { useState, useRef, useEffect, useCallback } from 'react'
import { LockIcon, CheckIcon } from './icons'

export interface HoldConfirmButtonProps {
  onConfirmed: () => void
  holdDurationMs?: number
  disabled?: boolean
  className?: string
  idleText?: string
  holdingText?: string
  confirmedText?: string
}

export function HoldConfirmButton({
  onConfirmed,
  holdDurationMs = 3000,
  disabled = false,
  className = '',
  idleText = 'برای تایید نهایی نگه‌دارید',
  holdingText = 'در حال تایید... نگه‌دارید',
  confirmedText = 'سفارش با موفقیت تایید شد',
}: HoldConfirmButtonProps) {
  const [progress, setProgress] = useState(0) // 0 to 100
  const [isHolding, setIsHolding] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)

  const holdStartRef = useRef<number | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const stopHolding = useCallback(() => {
    if (isConfirmed) return
    setIsHolding(false)
    holdStartRef.current = null
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    // Smoothly reset progress
    setProgress(0)
  }, [isConfirmed])

  const startHolding = useCallback(
    (e: React.SyntheticEvent) => {
      if (disabled || isConfirmed) return
      // Prevent context menu or callout on touch devices
      e.stopPropagation()

      setIsHolding(true)
      const startTime = performance.now()
      holdStartRef.current = startTime

      const step = (now: number) => {
        const elapsed = now - startTime
        const currentProgress = Math.min(100, (elapsed / holdDurationMs) * 100)
        setProgress(currentProgress)

        if (elapsed >= holdDurationMs) {
          // Completed 3 seconds!
          setIsHolding(false)
          setIsConfirmed(true)
          setIsSpinning(true)
          setProgress(100)

          // Trigger confirmation callback
          setTimeout(() => {
            onConfirmed()
          }, 600)
        } else {
          animFrameRef.current = requestAnimationFrame(step)
        }
      }

      animFrameRef.current = requestAnimationFrame(step)
    },
    [disabled, isConfirmed, holdDurationMs, onConfirmed]
  )

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <button
        type="button"
        disabled={disabled || isConfirmed}
        onPointerDown={startHolding}
        onPointerUp={stopHolding}
        onPointerLeave={stopHolding}
        onPointerCancel={stopHolding}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative w-full h-13 sm:h-14 px-5 rounded-2xl border-2 transition-all duration-200 overflow-hidden flex items-center justify-between shadow-md cursor-pointer select-none touch-manipulation active:scale-[0.99] ${
          isConfirmed
            ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/25 shadow-lg'
            : isHolding
            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 scale-[0.99]'
            : 'bg-emerald-50/90 hover:bg-emerald-100/80 border-emerald-400/80 text-emerald-900 hover:border-emerald-500'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        aria-label={isConfirmed ? confirmedText : idleText}
      >
        {/* Animated Background Progress Fill (RTL Start-to-End Fill) */}
        {!isConfirmed && (
          <div
            className="absolute inset-y-0 start-0 bg-emerald-400/60 transition-[width] ease-linear pointer-events-none"
            style={{
              width: `${progress}%`,
              transitionDuration: isHolding ? '50ms' : '200ms',
            }}
          />
        )}

        {/* Content Container (Layered above progress fill) */}
        <div className="relative z-10 w-full flex items-center justify-between gap-3">
          {/* Status Label & Micro-Prompt */}
          <div className="flex flex-col text-start min-w-0">
            <span className="text-xs sm:text-sm font-black tracking-tight truncate">
              {isConfirmed ? confirmedText : isHolding ? holdingText : idleText}
            </span>
            <span className="text-[10px] font-medium opacity-75 truncate">
              {isConfirmed
                ? 'درخواست شما ثبت قطعی گردید'
                : isHolding
                ? `${Math.round((progress / 100) * (holdDurationMs / 1000) * 10) / 10} ثانیه از ${Math.round(holdDurationMs / 1000)} ثانیه`
                : 'انگشت خود را به مدت ۳ ثانیه نگه دارید'}
            </span>
          </div>

          {/* Morphing & Rotating Icon (App Store Confirmation Style) */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs transition-all duration-500 ${
                isConfirmed
                  ? 'bg-white text-emerald-700 rotate-[360deg] scale-110'
                  : isHolding
                  ? 'bg-emerald-500 text-white scale-105'
                  : 'bg-emerald-200/80 text-emerald-900'
              } ${isSpinning ? 'rotate-[360deg]' : ''}`}
            >
              {isConfirmed ? (
                <CheckIcon size={20} className="stroke-[3] animate-in zoom-in-75 duration-200" />
              ) : (
                <LockIcon size={18} className="stroke-[2.2]" />
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}

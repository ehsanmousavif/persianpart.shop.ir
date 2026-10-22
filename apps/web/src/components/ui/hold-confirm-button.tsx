import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@heroui/react";
import { LockIcon, CheckIcon } from "./icons";

export interface HoldConfirmButtonProps {
  onConfirmed: () => void;
  holdDurationMs?: number;
  disabled?: boolean;
  className?: string;
  idleText?: string;
  holdingText?: string;
  confirmedText?: string;
}

export function HoldConfirmButton({
  onConfirmed,
  holdDurationMs = 2000,
  disabled = false,
  className = "",
  idleText = "برای تایید نهایی نگه‌دارید",
  holdingText = "در حال تایید... نگه‌دارید",
  confirmedText = "سفارش با موفقیت تایید شد",
}: HoldConfirmButtonProps) {
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isHolding, setIsHolding] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const holdStartRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopHolding = useCallback(() => {
    if (isConfirmed) return;
    setIsHolding(false);
    holdStartRef.current = null;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    // Smoothly reset progress
    setProgress(0);
  }, [isConfirmed]);

  const startHolding = useCallback(
    (e: React.SyntheticEvent) => {
      if (disabled || isConfirmed) return;
      // Prevent context menu or callout on touch devices
      e.stopPropagation();

      setIsHolding(true);
      const startTime = performance.now();
      holdStartRef.current = startTime;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const currentProgress = Math.min(100, (elapsed / holdDurationMs) * 100);
        setProgress(currentProgress);

        if (elapsed >= holdDurationMs) {
          // Completed 3 seconds!
          setIsHolding(false);
          setIsConfirmed(true);
          setIsSpinning(true);
          setProgress(100);

          // Trigger confirmation callback
          setTimeout(() => {
            onConfirmed();
          }, 600);
        } else {
          animFrameRef.current = requestAnimationFrame(step);
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    },
    [disabled, isConfirmed, holdDurationMs, onConfirmed],
  );

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative w-full overflow-hidden select-none ${className}`}>
      <Button
        type="button"
        isDisabled={disabled || isConfirmed}
        onPointerDown={startHolding}
        onPointerUp={stopHolding}
        onPointerLeave={stopHolding}
        onPointerCancel={stopHolding}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative w-full px-1 h-12 rounded-2xl transition-all duration-200 overflow-hidden flex items-center justify-between cursor-pointer select-none touch-manipulation active:scale-[0.99] ${
          isConfirmed
            ? "bg-success text-success-foreground"
            : isHolding
              ? "bg-success/15 text-foreground scale-[0.99]"
              : "bg-success/10 hover:bg-success/20 text-foreground"
        } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        aria-label={isConfirmed ? confirmedText : idleText}
      >
        {/* Animated Background Progress Fill (RTL Start-to-End Fill) */}
        {!isConfirmed && (
          <div
            className="absolute inset-y-0 inset-s-0 bg-success/40 transition-[width] ease-linear pointer-events-none"
            style={{
              width: `${progress}%`,
              transitionDuration: isHolding ? "50ms" : "200ms",
            }}
          />
        )}

        {/* Content Container (Layered above progress fill) */}
        <div className="relative z-10 w-full flex items-center justify-between gap-2 px-1">
          {/* Status Label & Micro-Prompt */}
          <div className="flex flex-col text-start min-w-0">
            <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
              {isConfirmed ? confirmedText : isHolding ? holdingText : idleText}
            </span>
          </div>

          {/* Morphing & Rotating Icon (App Store Confirmation Style) */}
          <div className="relative shrink-0 flex items-center justify-center">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-500 ${
                isConfirmed
                  ? "bg-surface text-success rotate-360deg scale-110"
                  : isHolding
                    ? "bg-success text-success-foreground scale-105"
                    : "bg-success/20 text-success"
              } ${isSpinning ? "rotate-360deg" : ""}`}
            >
              {isConfirmed ? (
                <CheckIcon
                  size={16}
                  className="stroke-3 animate-in zoom-in-75 duration-200"
                />
              ) : (
                <LockIcon size={15} className="stroke-[2.2]" />
              )}
            </div>
          </div>
        </div>
      </Button>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback, type TouchEvent as ReactTouchEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { Modal as HeroUIModal } from '@heroui/react'
import { XIcon, ZoomInIcon, ZoomOutIcon, RefreshCwIcon } from './icons'
import { toPersianDigits } from '../../lib/utils/currency'

export interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title?: string
}

export function ImageViewerModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'نمای بزرگ‌نمایی تصویر',
}: ImageViewerModalProps) {
  const [scale, setScale] = useState<number>(1)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const initialTouchDistanceRef = useRef<number | null>(null)
  const initialScaleRef = useRef<number>(1)

  // Reset transforms whenever opened or image changes
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, imageUrl])

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        handleZoom(0.25)
      } else if (e.key === '-') {
        handleZoom(-0.25)
      } else if (e.key === '0') {
        resetZoom()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleZoom = useCallback((delta: number) => {
    setScale((prev) => {
      const next = Math.min(4, Math.max(1, Math.round((prev + delta) * 100) / 100))
      if (next === 1) {
        setPosition({ x: 0, y: 0 })
      }
      return next
    })
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Mouse pan handling
  const handleMouseDown = (e: ReactMouseEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging || scale <= 1) return
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Wheel zoom (Desktop)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.2 : -0.2
    handleZoom(delta)
  }

  // Touch pinch-to-zoom and pan (Mobile)
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX
    const dy = t1.clientY - t2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = (e: ReactTouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0]!
      const t2 = e.touches[1]!
      initialTouchDistanceRef.current = getTouchDistance(t1, t2)
      initialScaleRef.current = scale
    } else if (e.touches.length === 1 && scale > 1) {
      const t = e.touches[0]!
      setIsDragging(true)
      dragStartRef.current = {
        x: t.clientX - position.x,
        y: t.clientY - position.y,
      }
    }
  }

  const handleTouchMove = (e: ReactTouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistanceRef.current) {
      const t1 = e.touches[0]!
      const t2 = e.touches[1]!
      const currentDist = getTouchDistance(t1, t2)
      const ratio = currentDist / initialTouchDistanceRef.current
      const newScale = Math.min(4, Math.max(1, initialScaleRef.current * ratio))
      setScale(newScale)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const t = e.touches[0]!
      setPosition({
        x: t.clientX - dragStartRef.current.x,
        y: t.clientY - dragStartRef.current.y,
      })
    }
  }

  const handleTouchEnd = () => {
    initialTouchDistanceRef.current = null
    setIsDragging(false)
  }

  const handleDoubleClick = () => {
    if (scale > 1) {
      resetZoom()
    } else {
      setScale(2.5)
    }
  }

  if (!isOpen) return null

  return (
    <HeroUIModal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <HeroUIModal.Backdrop
        isDismissable
        className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col select-none touch-none animate-backdrop-enter"
      >
        <HeroUIModal.Container className="pointer-events-none w-full h-full p-0 flex flex-col items-center justify-between">
          <HeroUIModal.Dialog className="pointer-events-auto relative w-full h-full max-w-xl mx-auto flex flex-col justify-between text-white overflow-hidden animate-modal-enter">
            {/* Top Floating Control Bar */}
      <div className="w-full max-w-xl mx-auto px-4 h-14 flex items-center justify-between z-20 shrink-0 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold truncate max-w-[200px] sm:max-w-xs text-slate-200">
            {title}
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {toPersianDigits(Math.round(scale * 100))}٪
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleZoom(0.3)}
            aria-label="بزرگ‌نمایی تصویر"
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="بزرگ‌نمایی (+)"
          >
            <ZoomInIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.3)}
            disabled={scale <= 1}
            aria-label="کوچک‌نمایی تصویر"
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="کوچک‌نمایی (-)"
          >
            <ZoomOutIcon size={18} />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            aria-label="بازنشانی اندازه تصویر"
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="بازنشانی (0)"
          >
            <RefreshCwIcon size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن گالری تصویر"
            className="w-9 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center transition-colors cursor-pointer ms-1"
            title="بستن (Esc)"
          >
            <XIcon size={18} />
          </button>
        </div>
      </div>

      {/* Main Viewport Container (Guaranteed: ONLY the <img> element scales) */}
      <div
        className="flex-1 w-full max-w-xl mx-auto relative overflow-hidden flex items-center justify-center p-2 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={imageUrl}
          alt={title}
          draggable={false}
          className="max-w-full max-h-[80vh] object-contain transition-transform duration-75 ease-out shadow-2xl rounded-lg will-change-transform"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }}
        />
      </div>

      {/* Bottom Hint */}
      <div className="w-full text-center pb-4 pt-1 text-xs text-slate-400 z-10 shrink-0 pointer-events-none">
        با انگشت بزرگ‌نمایی کنید یا دو بار ضربه بزنید (زوم فقط روی تصویر اعمال می‌شود)
      </div>
          </HeroUIModal.Dialog>
        </HeroUIModal.Container>
      </HeroUIModal.Backdrop>
    </HeroUIModal.Root>
  )
}

import { useState, useRef, useEffect, useCallback, type TouchEvent as ReactTouchEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { Modal as HeroUIModal, Button } from '@heroui/react'
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const initialTouchDistanceRef = useRef<number | null>(null)
  const initialScaleRef = useRef<number>(1)

  // Clamps translation so the image never pans outside the screen boundaries
  const clampPosition = useCallback((x: number, y: number, currentScale: number) => {
    if (currentScale <= 1) return { x: 0, y: 0 }
    const container = containerRef.current
    const viewportWidth = container ? container.clientWidth : window.innerWidth
    const viewportHeight = container ? container.clientHeight : window.innerHeight
    // Maximum delta allowed so image content remains comfortably visible
    const maxX = (viewportWidth * (currentScale - 1)) / 2
    const maxY = (viewportHeight * (currentScale - 1)) / 2
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    }
  }, [])

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
      } else {
        setPosition((pos) => clampPosition(pos.x, pos.y, next))
      }
      return next
    })
  }, [clampPosition])

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
    const newX = e.clientX - dragStartRef.current.x
    const newY = e.clientY - dragStartRef.current.y
    setPosition(clampPosition(newX, newY, scale))
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
      const newScale = Math.min(4, Math.max(1, Math.round(initialScaleRef.current * ratio * 100) / 100))
      setScale(newScale)
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 })
      } else {
        setPosition((pos) => clampPosition(pos.x, pos.y, newScale))
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const t = e.touches[0]!
      const newX = t.clientX - dragStartRef.current.x
      const newY = t.clientY - dragStartRef.current.y
      setPosition(clampPosition(newX, newY, scale))
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
      setScale(2)
      setPosition({ x: 0, y: 0 })
    }
  }

  if (!isOpen) return null

  return (
    <HeroUIModal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <HeroUIModal.Backdrop
        isDismissable
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none touch-none animate-backdrop-enter"
      >
        <HeroUIModal.Container className="pointer-events-none w-full h-full p-0 flex flex-col items-center justify-between">
          <HeroUIModal.Dialog className="pointer-events-auto relative w-full h-full max-w-xl mx-auto flex flex-col justify-between text-foreground overflow-hidden animate-modal-enter">
            {/* Top Floating Control Bar */}
            <div className="w-full max-w-xl mx-auto px-3 h-12 flex items-center justify-between gap-2 z-20 shrink-0 text-foreground">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold  max-w-30 sm:max-w-xs text-foreground">
                  {title}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/90 shrink-0">
                  {toPersianDigits(Math.round(scale * 100))}٪
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  onPress={() => handleZoom(0.3)}
                  aria-label="بزرگ‌نمایی تصویر (+)"
                  className="w-8 h-8 rounded-lg bg-foreground/10 hover:bg-foreground/20 active:scale-95 text-foreground flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ZoomInIcon size={16} />
                </Button>
                <Button
                  type="button"
                  onPress={() => handleZoom(-0.3)}
                  isDisabled={scale <= 1}
                  aria-label="کوچک‌نمایی تصویر (-)"
                  className="w-8 h-8 rounded-lg bg-foreground/10 hover:bg-foreground/20 active:scale-95 text-foreground flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ZoomOutIcon size={16} />
                </Button>
                <Button
                  type="button"
                  onPress={resetZoom}
                  aria-label="بازنشانی اندازه تصویر (0)"
                  className="w-8 h-8 rounded-lg bg-foreground/10 hover:bg-foreground/20 active:scale-95 text-foreground flex items-center justify-center transition-colors cursor-pointer"
                >
                  <RefreshCwIcon size={14} />
                </Button>
                <Button
                  type="button"
                  onPress={onClose}
                  aria-label="بستن گالری تصویر (Esc)"
                  className="w-8 h-8 rounded-lg bg-danger hover:bg-danger/90 active:scale-95 text-foreground flex items-center justify-center transition-colors cursor-pointer ms-0.5"
                >
                  <XIcon size={16} />
                </Button>
              </div>
            </div>

            {/* Main Viewport Container with Clamped Pan */}
            <div
              ref={containerRef}
              className="flex-1 w-full max-w-xl mx-auto relative overflow-hidden flex items-center justify-center p-2 cursor-grab active:cursor-grabbing touch-none select-none"
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
                className="max-w-full max-h-[75vh] object-contain transition-transform duration-75 ease-out rounded-lg will-change-transform select-none pointer-events-none"
                style={{
                  transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
                  transformOrigin: 'center center',
                }}
              />
            </div>

            {/* Bottom Hint */}
            <div className="w-full text-center pb-4 pt-1 text-xs text-foreground/60 z-10 shrink-0 pointer-events-none">
              با انگشت بزرگ‌نمایی کنید یا دو بار ضربه بزنید (زوم فقط روی تصویر اعمال می‌شود)
            </div>
          </HeroUIModal.Dialog>
        </HeroUIModal.Container>
      </HeroUIModal.Backdrop>
    </HeroUIModal.Root>
  )
}

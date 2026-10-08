import React, { useEffect } from 'react'
import { Modal as HeroUIModal } from '@heroui/react'
import { XIcon } from './icons'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  isBottomSheetOnMobile?: boolean
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  isBottomSheetOnMobile = true,
  className = '',
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <HeroUIModal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <HeroUIModal.Backdrop
        isDismissable
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-backdrop-enter"
      >
        <HeroUIModal.Container className="pointer-events-none w-full max-w-xl h-auto p-0 flex flex-col items-center">
          <HeroUIModal.Dialog
            className={`pointer-events-auto relative w-full bg-white shadow-2xl z-10 border border-slate-200/90 text-start overflow-hidden ${
              isBottomSheetOnMobile
                ? 'rounded-t-3xl sm:rounded-2xl max-h-[88vh] flex flex-col animate-drawer-slide-up sm:animate-modal-enter'
                : 'rounded-2xl max-h-[90vh] my-auto animate-modal-enter'
            } ${className}`}
          >
            {/* Mobile handle indicator */}
            {isBottomSheetOnMobile && (
              <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-slate-300" />
              </div>
            )}

            {/* Header */}
            {title && (
              <HeroUIModal.Header className="flex items-center justify-between px-4.5 py-3 border-b border-slate-100">
                <HeroUIModal.Heading className="text-sm font-black text-slate-900">
                  {title}
                </HeroUIModal.Heading>
                <HeroUIModal.CloseTrigger
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl -me-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                  aria-label="بستن پنجره"
                >
                  <XIcon size={18} />
                </HeroUIModal.CloseTrigger>
              </HeroUIModal.Header>
            )}

            {/* Body */}
            <HeroUIModal.Body className="p-4 overflow-y-auto overscroll-contain flex-1">
              {children}
            </HeroUIModal.Body>
          </HeroUIModal.Dialog>
        </HeroUIModal.Container>
      </HeroUIModal.Backdrop>
    </HeroUIModal.Root>
  )
}


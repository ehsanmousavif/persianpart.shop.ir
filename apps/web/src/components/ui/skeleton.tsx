import { Skeleton as HeroUISkeleton } from '@heroui/react'

export { HeroUISkeleton as Skeleton }

export function ProductCardSkeleton({
  viewMode = 'list',
}: {
  viewMode?: 'list' | 'grid-2' | 'compact' | 'showcase'
} = {}) {
  if (viewMode === 'grid-2') {
    return (
      <div className="flex flex-col bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2.5">
        <HeroUISkeleton className="w-full aspect-square rounded-xl" />
        <div className="space-y-1.5">
          <HeroUISkeleton className="w-16 h-3 rounded-md" />
          <HeroUISkeleton className="w-4/5 h-4 rounded-md" />
          <div className="flex gap-1.5 pt-0.5">
            <HeroUISkeleton className="w-12 h-4 rounded-md" />
            <HeroUISkeleton className="w-12 h-4 rounded-md" />
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
          <HeroUISkeleton className="w-18 h-4 rounded-md" />
          <HeroUISkeleton className="w-10 h-3 rounded-md" />
        </div>
      </div>
    )
  }

  if (viewMode === 'compact') {
    return (
      <div className="flex items-center justify-between p-2 sm:px-3 bg-white border border-slate-200/90 rounded-xl shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <HeroUISkeleton className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg shrink-0" />
          <div className="space-y-1 flex-1 min-w-0">
            <HeroUISkeleton className="w-2/5 h-3.5 rounded-md" />
            <HeroUISkeleton className="w-1/4 h-2.5 rounded-md" />
          </div>
        </div>
        <HeroUISkeleton className="w-16 h-4 rounded-md shrink-0 ms-2" />
      </div>
    )
  }

  if (viewMode === 'showcase') {
    return (
      <div className="flex flex-col bg-white border border-slate-200/90 rounded-3xl p-3 sm:p-3.5 shadow-xs space-y-3">
        <HeroUISkeleton className="w-full aspect-16/10 rounded-2xl" />
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <HeroUISkeleton className="w-24 h-4 rounded-md" />
            <HeroUISkeleton className="w-16 h-5 rounded-full" />
          </div>
          <HeroUISkeleton className="w-3/5 h-5 rounded-md" />
          <HeroUISkeleton className="w-full h-3 rounded-md" />
        </div>
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
          <HeroUISkeleton className="w-24 h-5 rounded-md" />
          <HeroUISkeleton className="w-20 h-7 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-row items-center gap-3 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
      <HeroUISkeleton className="w-15 h-15 sm:w-18 sm:h-18 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2">
          <HeroUISkeleton className="w-14 h-4 rounded-md" />
          <HeroUISkeleton className="w-10 h-4 rounded-full" />
          <HeroUISkeleton className="w-12 h-3.5 rounded-md" />
        </div>
        <HeroUISkeleton className="w-4/5 h-4.5 rounded-md" />
        <HeroUISkeleton className="w-1/2 h-3.5 rounded-md" />
      </div>
      <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 ps-2 sm:ps-3 border-s border-slate-100 space-y-2">
        <div className="flex flex-col items-end space-y-1">
          <HeroUISkeleton className="w-18 h-4 rounded-md" />
          <HeroUISkeleton className="w-10 h-2.5 rounded-md" />
        </div>
        <HeroUISkeleton className="w-16 h-8 rounded-xl" />
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs space-y-3">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2">
          <HeroUISkeleton className="w-24 h-6 rounded-lg" />
          <HeroUISkeleton className="w-20 h-6 rounded-full" />
        </div>
        <HeroUISkeleton className="w-20 h-4 rounded-md" />
      </div>

      {/* Items Thumbnails & Specs */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <HeroUISkeleton className="w-12 h-12 rounded-xl shrink-0" />
          <HeroUISkeleton className="w-12 h-12 rounded-xl shrink-0" />
          <div className="ps-1 space-y-1.5 flex-1">
            <HeroUISkeleton className="w-20 h-4 rounded-md" />
            <HeroUISkeleton className="w-28 h-3.5 rounded-md" />
          </div>
        </div>

        {/* Financials & Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <HeroUISkeleton className="w-16 h-3 rounded-md" />
            <HeroUISkeleton className="w-24 h-5 rounded-md" />
          </div>

          <div className="flex items-center gap-1.5">
            <HeroUISkeleton className="w-14 h-8 rounded-xl" />
            <HeroUISkeleton className="w-16 h-8 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderDetailSkeleton() {
  return (
    <div className="w-full max-w-xl mx-auto px-3 py-3 space-y-3.5">
      {/* Top navigation & badge */}
      <div className="flex items-center justify-between gap-2">
        <HeroUISkeleton className="w-24 h-8 rounded-xl" />
        <HeroUISkeleton className="w-28 h-6 rounded-full" />
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <HeroUISkeleton className="w-32 h-6 rounded-lg" />
          <HeroUISkeleton className="w-20 h-4 rounded-md" />
        </div>
        <HeroUISkeleton className="w-48 h-4 rounded-md" />
      </div>

      {/* Timeline card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <HeroUISkeleton className="w-36 h-5 rounded-md" />
        <div className="space-y-3 pt-2">
          <HeroUISkeleton className="w-full h-12 rounded-xl" />
          <HeroUISkeleton className="w-full h-12 rounded-xl" />
          <HeroUISkeleton className="w-full h-12 rounded-xl" />
        </div>
      </div>

      {/* Items card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <HeroUISkeleton className="w-28 h-5 rounded-md" />
        <div className="space-y-2 pt-1">
          <HeroUISkeleton className="w-full h-16 rounded-xl" />
          <HeroUISkeleton className="w-full h-16 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function PlanCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <HeroUISkeleton className="w-28 h-5 rounded-full" />
            <HeroUISkeleton className="w-24 h-5 rounded-full" />
          </div>
          <HeroUISkeleton className="w-48 h-6 rounded-md" />
        </div>
      </div>
      <HeroUISkeleton className="w-full h-16 rounded-2xl" />
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <HeroUISkeleton className="w-32 h-4 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <HeroUISkeleton className="w-full h-14 rounded-2xl" />
          <HeroUISkeleton className="w-full h-14 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

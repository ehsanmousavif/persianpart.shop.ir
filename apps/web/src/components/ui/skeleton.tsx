import { Skeleton as HeroUISkeleton } from '@heroui/react'

export { HeroUISkeleton as Skeleton }

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-row items-center gap-3 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
      <HeroUISkeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2">
          <HeroUISkeleton className="w-14 h-4 rounded-md" />
          <HeroUISkeleton className="w-10 h-4 rounded-full" />
          <HeroUISkeleton className="w-12 h-3.5 rounded-md" />
        </div>
        <HeroUISkeleton className="w-4/5 h-4.5 rounded-md" />
        <HeroUISkeleton className="w-1/2 h-3.5 rounded-md" />
        <HeroUISkeleton className="w-3/5 h-3 rounded-md" />
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
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <HeroUISkeleton className="w-32 h-5 rounded-md" />
        <HeroUISkeleton className="w-24 h-6 rounded-full" />
      </div>
      <HeroUISkeleton className="w-48 h-4 rounded-md" />
      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
        <HeroUISkeleton className="w-20 h-4 rounded-md" />
        <HeroUISkeleton className="w-28 h-5 rounded-md" />
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

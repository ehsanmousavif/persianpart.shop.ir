import React from 'react'

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
      {...props}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-row items-center gap-3 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs animate-pulse">
      <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className="w-14 h-4 rounded" />
          <Skeleton className="w-10 h-4 rounded-full" />
          <Skeleton className="w-12 h-3.5 rounded" />
        </div>
        <Skeleton className="w-4/5 h-4.5 rounded" />
        <Skeleton className="w-1/2 h-3.5 rounded" />
        <Skeleton className="w-3/5 h-3 rounded" />
      </div>
      <div className="flex flex-col items-end justify-between shrink-0 self-stretch py-0.5 ps-2 sm:ps-3 border-s border-slate-100 space-y-2">
        <div className="flex flex-col items-end space-y-1">
          <Skeleton className="w-18 h-4 rounded" />
          <Skeleton className="w-10 h-2.5 rounded" />
        </div>
        <Skeleton className="w-16 h-8 rounded-xl" />
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="w-32 h-5" />
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>
      <Skeleton className="w-48 h-4" />
      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-28 h-5" />
      </div>
    </div>
  )
}

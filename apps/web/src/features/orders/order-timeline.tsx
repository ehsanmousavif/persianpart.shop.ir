import type { TimelineStep } from '../../lib/mock-data/orders'
import { CheckIcon, ClockIcon, XIcon } from '../../components/ui/icons'

export interface OrderTimelineProps {
  steps: TimelineStep[]
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="relative ps-6 space-y-6 before:absolute before:start-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
      {steps.map((step) => {
        const isCompleted = step.status === 'completed'
        const isCurrent = step.status === 'current'
        const isCancelled = step.status === 'cancelled'

        return (
          <div key={step.id} className="relative flex items-start gap-4">
            {/* Dot Indicator */}
            <div
              className={`absolute -start-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ring-4 ring-white z-10 ${
                isCompleted
                  ? 'bg-emerald-600'
                  : isCurrent
                  ? 'bg-slate-900 shadow-md shadow-slate-900/30'
                  : isCancelled
                  ? 'bg-rose-600'
                  : 'bg-slate-300'
              }`}
            >
              {isCompleted ? (
                <CheckIcon size={12} className="stroke-[3]" />
              ) : isCurrent ? (
                <ClockIcon size={12} />
              ) : isCancelled ? (
                <XIcon size={12} className="stroke-[3]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>

            {/* Details Card */}
            <div
              className={`flex-1 text-start transition-all ${
                isCancelled
                  ? 'p-2.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-xs'
                  : 'py-0.5'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-sm font-bold ${
                      isCurrent
                        ? 'text-slate-900 font-bold'
                        : isCompleted
                        ? 'text-slate-900 font-semibold'
                        : isCancelled
                        ? 'text-rose-700 font-bold'
                        : 'text-slate-400 font-medium'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-900 text-white shadow-2xs">
                      موقعیت کنونی
                    </span>
                  )}
                  {isCancelled && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
                      لغو نهایی
                    </span>
                  )}
                </div>

                {step.timestamp && (
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {step.timestamp}
                  </span>
                )}
              </div>

              <p
                className={`text-xs leading-relaxed ${
                  isCurrent ? 'text-slate-700 font-medium' : 'text-slate-500'
                }`}
              >
                {step.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}


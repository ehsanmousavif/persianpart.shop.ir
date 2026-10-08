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
              className={`absolute -start-6 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ring-4 ring-white ${
                isCompleted
                  ? 'bg-emerald-600'
                  : isCurrent
                  ? 'bg-blue-600 shadow-md shadow-blue-500/40 animate-pulse'
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

            {/* Details */}
            <div className="flex-1 text-start">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-0.5">
                <h4
                  className={`text-sm font-bold ${
                    isCurrent
                      ? 'text-blue-700'
                      : isCompleted
                      ? 'text-slate-900'
                      : isCancelled
                      ? 'text-rose-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </h4>
                {step.timestamp && (
                  <span className="text-[11px] font-medium text-slate-400">
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

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

            {/* Details Card */}
            <div
              className={`flex-1 text-start transition-all ${
                isCurrent
                  ? 'p-3 rounded-2xl bg-blue-50/60 border border-blue-200/80 shadow-xs'
                  : isCancelled
                  ? 'p-3 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-xs'
                  : 'py-0.5'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <h4
                    className={`text-sm font-bold ${
                      isCurrent
                        ? 'text-blue-800 font-bold'
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
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-xs animate-pulse">
                      موقعیت کنونی
                    </span>
                  )}
                  {isCancelled && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-600 text-white shadow-xs">
                      لغو نهایی
                    </span>
                  )}
                </div>

                {step.timestamp && (
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  >
                    {step.timestamp}
                  </span>
                )}
              </div>

              <p
                className={`text-xs leading-relaxed ${
                  isCurrent ? 'text-slate-800 font-medium' : 'text-slate-500'
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

export function OrderMiniStepper({ steps }: { steps: TimelineStep[] }) {
  const currentStep = steps.find((s) => s.status === 'current') || steps[steps.length - 1]

  return (
    <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
          <ClockIcon size={12} className="text-blue-600" />
          <span>موقعیت سفارش:</span>
        </span>
        <span className="text-xs font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping inline-block" />
          {currentStep?.title || 'در حال پردازش'}
        </span>
      </div>

      {/* Progress Dots Track */}
      <div className="relative flex items-center justify-between px-1 pt-1 pb-0.5">
        <div className="absolute top-1/2 start-3 end-3 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
        {steps.map((step, idx) => {
          const isDone = step.status === 'completed'
          const isNow = step.status === 'current'
          const isCanc = step.status === 'cancelled'

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center" title={`${step.title} - ${step.description}`}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isDone
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : isNow
                    ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 shadow-sm animate-pulse'
                    : isCanc
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isDone ? '✓' : isNow ? '●' : isCanc ? '✕' : ''}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap hidden sm:block ${
                  isNow
                    ? 'font-bold text-blue-700'
                    : isDone
                    ? 'font-medium text-slate-700'
                    : 'text-slate-400 font-normal'
                }`}
              >
                {step.title.split(' ')[0]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

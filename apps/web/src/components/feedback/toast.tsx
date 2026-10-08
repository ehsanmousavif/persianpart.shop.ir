import { useState, useEffect } from 'react'
import { CheckCircle2Icon, AlertCircleIcon, AlertTriangleIcon, XIcon } from '../ui/icons'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: ToastType
}

type ToastListener = (toasts: ToastMessage[]) => void

let toastsList: ToastMessage[] = []
const listeners = new Set<ToastListener>()

function notify() {
  listeners.forEach((listener) => listener([...toastsList]))
}

export const toast = {
  show: (title: string, description?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastMessage = { id, title, description, type }
    toastsList = [newToast, ...toastsList.slice(0, 2)]
    notify()

    setTimeout(() => {
      toast.dismiss(id)
    }, 3500)
  },
  success: (title: string, description?: string) => toast.show(title, description, 'success'),
  error: (title: string, description?: string) => toast.show(title, description, 'error'),
  warning: (title: string, description?: string) => toast.show(title, description, 'warning'),
  info: (title: string, description?: string) => toast.show(title, description, 'info'),
  dismiss: (id: string) => {
    toastsList = toastsList.filter((t) => t.id !== id)
    notify()
  },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    listeners.add(setToasts)
    return () => {
      listeners.delete(setToasts)
    }
  }, [])

  if (toasts.length === 0) return null

  const icons = {
    success: <CheckCircle2Icon className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />,
    warning: <AlertTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <AlertCircleIcon className="w-5 h-5 text-blue-600 shrink-0" />,
  }

  const borderClasses = {
    success: 'border-emerald-200 bg-white shadow-emerald-500/10',
    error: 'border-rose-200 bg-white shadow-rose-500/10',
    warning: 'border-amber-200 bg-white shadow-amber-500/10',
    info: 'border-blue-200 bg-white shadow-blue-500/10',
  }

  return (
    <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:end-6 sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 ${borderClasses[t.type]} animate-in slide-in-from-top-4`}
        >
          {icons[t.type]}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
            {t.description && (
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="text-slate-400 hover:text-slate-700 p-1 -mt-1 -me-1 cursor-pointer"
          >
            <XIcon size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

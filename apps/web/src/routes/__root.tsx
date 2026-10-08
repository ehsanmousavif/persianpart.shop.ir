import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppHeader } from '../components/layout/app-header'
import { MobileBottomNav } from '../components/layout/mobile-bottom-nav'
import { ToastContainer } from '../components/feedback/toast'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-slate-200/80 flex justify-center selection:bg-blue-600 selection:text-white" dir="rtl">
      <div className="w-full max-w-xl min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col shadow-2xl relative border-x border-slate-300/70">
        <AppHeader />

        {/* Main App Content Area */}
        <main className="flex-1 pb-24 w-full">
          <Outlet />
        </main>

        {/* Permanent Bottom Navigation Bar */}
        <MobileBottomNav />

        {/* Global Toast Notification Container */}
        <ToastContainer />
      </div>
    </div>
  )
}

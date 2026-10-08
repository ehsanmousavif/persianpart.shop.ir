import { useEffect } from 'react'
import { createRootRoute, Outlet, redirect, useNavigate, useRouterState } from '@tanstack/react-router'
import { AppHeader } from '../components/layout/app-header'
import { MobileBottomNav } from '../components/layout/mobile-bottom-nav'
import { ToastContainer } from '../components/feedback/toast'
import { authStore, useAuth } from '../features/auth/auth-store'

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const isAuth = authStore.getState().isAuthenticated
    const isLoginPage = location.pathname === '/login'

    if (!isAuth && !isLoginPage) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    if (isAuth && isLoginPage) {
      throw redirect({
        to: '/product',
      })
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const { isAuthenticated } = useAuth()
  const routerState = useRouterState()
  const navigate = useNavigate()
  const pathname = routerState.location.pathname
  const isLoginPage = pathname === '/login'

  // Dynamic client-side redirect if auth state drops while on a protected page
  useEffect(() => {
    if (!isAuthenticated && !isLoginPage) {
      navigate({
        to: '/login',
      })
    }
  }, [isAuthenticated, isLoginPage, navigate])

  return (
    <div className="min-h-screen bg-slate-200/60 flex justify-center selection:bg-slate-200 selection:text-slate-900" dir="rtl">
      <div className="w-full max-w-xl min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col shadow-xl relative border-x border-slate-200/90">
        <AppHeader />

        {/* Main App Content Area */}
        <main className={`flex-1 w-full ${isLoginPage ? 'pb-6' : 'pb-24'}`}>
          <Outlet />
        </main>

        {/* Permanent Bottom Navigation Bar (Hidden on login) */}
        {!isLoginPage && <MobileBottomNav />}

        {/* Global Toast Notification Container */}
        <ToastContainer />
      </div>
    </div>
  )
}


import { useEffect } from 'react'
import { createRootRoute, Outlet, redirect, useNavigate, useRouterState } from '@tanstack/react-router'
import { AppHeader } from '../components/layout/app-header'
import { MobileBottomNav } from '../components/layout/mobile-bottom-nav'
import { ToastContainer } from '../components/feedback/toast'
import { authStore, useAuth } from '../features/auth/auth-store'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'

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
    <NuqsAdapter>
      <div
        className={`bg-white flex justify-center selection:bg-primary/20 selection:text-foreground ${
          isLoginPage ? 'h-dvh overflow-hidden' : 'min-h-screen'
        }`}
        dir="rtl"
      >
        <div
          className={`w-full bg-white text-foreground font-sans antialiased flex flex-col ${
            isLoginPage ? 'h-dvh overflow-hidden' : 'min-h-screen'
          }`}
        >
          <AppHeader />
          <ToastContainer />
          {/* Main App Content Area */}
          <main
            className={
              isLoginPage
                ? 'flex-1 w-full flex flex-col overflow-hidden relative'
                : 'flex-1 max-w-xl mx-auto w-full pb-12'
            }
          >
            <Outlet />
          </main>

          {/* Permanent Bottom Navigation Bar (Hidden on login) */}
          {!isLoginPage && <MobileBottomNav />}
        </div>
      </div>
    </NuqsAdapter>
  )
}


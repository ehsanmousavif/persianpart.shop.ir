import { Link, useRouterState } from '@tanstack/react-router'
import { useAuth } from '../../features/auth/auth-store'
import { UserIcon } from '../ui/icons'

export function AppHeader() {
  const { user, isAuthenticated } = useAuth()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const isAccountActive = pathname === '/account'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="w-full px-3.5 h-14 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link to="/product" className="flex items-center gap-2 group cursor-pointer shrink-0 active:scale-98 transition-transform">
          
          <div className="flex items-center gap-1.5">
           <img src="/assets/images/logo.jpg" alt="پرشین‌پارت" className="w-8 h-8" />            
          </div>
        </Link>

        {/* Actions: Profile ONLY */}
        <div className="flex items-center gap-2 shrink-0">

          {/* User Profile / Login Link */}
          {isAuthenticated && user ? (
            <Link
              to="/account"
              className={`w-9.5 h-9.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                isAccountActive
                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
              }`}
              aria-label="حساب کاربری"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {user.name.slice(0, 1)}
              </div>
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-9.5 h-9.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center active:scale-95"
              aria-label="ورود همکاران"
            >
              <UserIcon size={18} />
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

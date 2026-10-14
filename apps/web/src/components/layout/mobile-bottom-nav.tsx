import { Link, useRouterState } from '@tanstack/react-router'
import { GridIcon, PackageIcon, UserIcon, ClipboardListIcon } from '../ui/icons'

export function MobileBottomNav() {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  // Do not show bottom nav on product quantity configuration page
  if (pathname.startsWith('/product/new') || pathname.startsWith('/products/new')) {
    return null
  }

  const navItems = [
    {
      to: '/product',
      label: 'محصولات',
      icon: GridIcon,
      isActive: pathname.startsWith('/product') || pathname === '/',
    },
    {
      to: '/plans',
      label: 'طرح‌ها',
      icon: ClipboardListIcon,
      isActive: pathname.startsWith('/plans'),
    },
    {
      to: '/orders',
      label: 'سفارش‌ها',
      icon: PackageIcon,
      isActive: pathname.startsWith('/orders'),
    },
    {
      to: '/account',
      label: 'حساب من',
      icon: UserIcon,
      isActive: pathname === '/account',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl rounded-t-2xl bg-surface/95 backdrop-blur-md border border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="grid grid-cols-4 h-16 w-full">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 transition-all relative cursor-pointer active:scale-95 ${
                item.isActive ? 'text-primary' : 'text-muted hover:text-foreground'
              }`}
            >
              <div className="relative">
                <Icon size={20} className={item.isActive ? 'stroke-[2.2]' : 'stroke-2'} />
              </div>
              <span className={`text-xs font-semibold ${item.isActive ? 'text-primary' : 'text-muted'}`}>
                {item.label}
              </span>
              {item.isActive && (
                <span className="absolute top-0 w-7 h-0.5 bg-primary rounded-b-full shadow-xs" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

import { Link, useRouterState } from "@tanstack/react-router";
import {
  GridIcon,
  PackageIcon,
  UserIcon,
  ClipboardListIcon,
} from "../ui/icons";
import { cn } from "../../lib/utils";

export function MobileBottomNav() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Do not show bottom nav on product quantity configuration page
  if (
    pathname.startsWith("/product/new") ||
    pathname.startsWith("/products/new")
  ) {
    return null;
  }

  const navItems = [
    {
      to: "/product",
      label: "محصولات",
      icon: GridIcon,
      isActive: pathname.startsWith("/product") || pathname === "/",
    },
    {
      to: "/plans",
      label: "طرح‌ها",
      icon: ClipboardListIcon,
      isActive: pathname.startsWith("/plans"),
    },
    {
      to: "/orders",
      label: "سفارش‌ها",
      icon: PackageIcon,
      isActive: pathname.startsWith("/orders"),
    },
    {
      to: "/account",
      label: "حساب من",
      icon: UserIcon,
      isActive: pathname === "/account",
    },
  ];

  return (
    <>
      <nav
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] inset-x-0 mx-auto w-[calc(100%-32px)] max-w-xl z-40 p-1.5 rounded-2xl bg-[#252745] backdrop-blur-xl"
      >
        <div className="flex h-14 w-full items-center justify-between gap-1 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col w-fit rounded-2xl px-4 text-muted hover:bg-default/15 items-center justify-center gap-0.5 transition-all relative cursor-pointer active:scale-95 py-1",
                  item.isActive
                    ? "text-primary"
                    : "text-muted hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "relative px-3 py-1 rounded-xl transition-all flex items-center justify-center",
                    item.isActive && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon
                    size={19}
                    className={cn(
                      item.isActive ? "stroke-[2.2] text-background" : "stroke-2 text-[#b8b9c3]"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px] font-bold tracking-tight transition-colors",
                    item.isActive ? "text-background" : "text-[#b8b9c3]"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      {/* Solid white underlay for the space below nav bottom */}
      <div
        className="fixed bottom-0 inset-x-0 h-[calc(1.5rem+env(safe-area-inset-bottom,0px))] bg-white z-30 pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}

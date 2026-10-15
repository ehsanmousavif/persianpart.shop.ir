import { Link, useRouterState } from "@tanstack/react-router";
import {
  GridIcon,
  PackageIcon,
  UserIcon,
  ClipboardListIcon,
} from "../ui/icons";

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
    <nav
      className="fixed bottom-4 inset-x-0 mx-auto  w-[calc(100%-32px)] max-w-xl z-40 p-1.5 pb-safe rounded-3xl bg-[#252745] backdrop-blur-xl border border-border/80 shadow-[1px_50px_10px_rgba(255,255,255,1)]"
    >
      <div className="flex h-14 w-full items-center justify-between gap-1 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col w-fit rounded-3xl px-4 text-muted hover:bg-default/15 items-center justify-center gap-0.5 transition-all relative cursor-pointer active:scale-95 py-1 ${
                item.isActive
                  ? "text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <div
                className={`relative px-3 py-1  rounded-[12px] transition-all flex items-center justify-center ${
                  item.isActive
                    ? "bg-primary/10 text-primary"
                    : ""
                }`}
              >
                <Icon
                  size={19}
                  className={item.isActive ? "stroke-[2.2]  text-background" : "stroke-2 text-[#b8b9c3] "}
                />
              </div>
              <span
                className={`text-[11px] font-bold tracking-tight transition-colors ${
                  item.isActive ?"text-background"  : "text-[#b8b9c3]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

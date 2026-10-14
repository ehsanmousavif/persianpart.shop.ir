import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "../../features/auth/auth-store";
import { UserIcon } from "../ui/icons";

export function AppHeader() {
  const { user, isAuthenticated } = useAuth();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  let pageName: string;

  switch (true) {
    case pathname.startsWith("/product") || pathname === "/":
      pageName = "محصولات";
      break;

    case pathname.startsWith("/plans"):
      pageName = "طرح‌ها";
      break;

    case pathname.startsWith("/orders"):
      pageName = "سفارش‌ها";
      break;

    case pathname.startsWith("/login"):
      pageName = "ورود";
      break;

    case pathname === "/account":
      pageName = "حساب من";
      break;

    default:
      pageName = "";
      break;
  }

  return (
    <header className="sticky top-0 z-40  w-full border-b border-border bg-surface/95 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="w-full px-3.5 h-14 max-w-xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link
          to="/product"
          className="flex items-center gap-2 group cursor-pointer shrink-0 active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-1.5">
            <img
              src="/assets/images/persian-part-logo.png"
              alt="پرشین‌پارت"
              className="w-8 h-8"
            />
          </div>
        </Link>
        <span className="font-bold text-foreground text-sm">{pageName}</span>
        {/* Actions: Profile */}
        {isAuthenticated && user ? (
          <Link
            to="/account"
                        className="w-9.5 h-9.5 rounded-xl border border-border bg-default/15 hover:bg-default/25 text-foreground transition-all flex items-center justify-center active:scale-95"

            aria-label="حساب کاربری"
          >
                       <UserIcon size={20} className="text-primary" />

          </Link>
        ) : (
          <Link
            to="/login"
            className="w-9.5 h-9.5 rounded-xl border border-border bg-default/15 hover:bg-default/25 text-foreground transition-all flex items-center justify-center active:scale-95"
            aria-label="ورود همکاران"
          >
                        <UserIcon size={20} className="text-primary" />

          </Link>
        )}
      </div>
    </header>
  );
}

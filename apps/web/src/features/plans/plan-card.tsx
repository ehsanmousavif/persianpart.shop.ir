import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import type { Plan, Product } from "../../types";
import { toPersianDigits, formatToman } from "../../lib/utils/currency";
import { cn } from "../../lib/utils";
import {
  BoxIcon,
  ArrowLeftIcon,
  TomanIcon,
  ClockIcon,
} from "../../components/ui/icons";
import {
  BellBoldDuotoneIcon,
} from "@solar-icons/react";

export interface PlanCardProps {
  plan: Plan;
  products: Product[];
}

function PlanCountdownTimer({ expiresAt }: { expiresAt?: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    let targetDate = expiresAt ? new Date(expiresAt).getTime() : NaN;
    if (isNaN(targetDate) || targetDate <= Date.now()) {
      // Demo countdown duration so it always ticks live
      targetDate = Date.now() + (36 * 3600 + 45 * 60) * 1000;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!timeLeft) return null;

  const { days, hours, minutes, seconds, isExpired } = timeLeft;
  const h = hours.toString().padStart(2, "0");
  const m = minutes.toString().padStart(2, "0");
  const s = seconds.toString().padStart(2, "0");

  return (
    <div
      className={cn(
        "text-center font-bold text-sm text-background tracking-widest tabular-nums select-none z-10",
      )}
      dir="ltr"
      aria-label="تایمر مهلت طرح"
    >
      {isExpired ? (
        <span>{toPersianDigits("۰۰ : ۰۰ : ۰۰")}</span>
      ) : (
        <>
          {days > 0 && <span>{toPersianDigits(days)} : </span>}
          <span>{toPersianDigits(h)}</span>
          <span className="mx-0.5 opacity-80 animate-pulse">:</span>
          <span>{toPersianDigits(m)}</span>
          <span className="mx-0.5 opacity-80 animate-pulse">:</span>
          <span>{toPersianDigits(s)}</span>
        </>
      )}
    </div>
  );
}

// Generate a deterministic demo countdown for any plan
function getPlanDemoExpiry(plan: Plan): string {
  if (plan.expiresAt) {
    const t = new Date(plan.expiresAt).getTime();
    if (!isNaN(t) && t > Date.now()) {
      return plan.expiresAt;
    }
  }
  const seed = (plan.id || plan.title || "1")
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hours = ((seed * 19) % 65) + 14;
  const minutes = ((seed * 7) % 55) + 5;
  return new Date(
    Date.now() + (hours * 3600 + minutes * 60) * 1000,
  ).toISOString();
}

export function PlanCard({ plan, products }: PlanCardProps) {
  const planProducts = (plan.productIds || [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const isCompleted =
    plan.status === "completed" || plan.status === "successful";

  const isActive =
    !isCompleted &&
    (plan.status === "active" || (plan.status === undefined && plan.isActive));

  const showTimer = plan.hasTimer !== false;
  const activeExpiry = getPlanDemoExpiry(plan);

  return (
    <div
      className={cn(
        "px-4 pt-4 flex flex-col justify-around bg-foreground/20 gap-4 text-start transition-all h-full rounded-3xl text-background! relative overflow-hidden",
        !isActive && !isCompleted && "opacity-85",
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="w-full flex gap-1 items-center text-base font-semibold text-foreground leading-snug">
              <BellBoldDuotoneIcon className="text-yellow-500" />
              <span className="text-base">{plan.title}</span>
              {showTimer && (
                <div className="w-fit flex items-center gap-1.5 bg-foreground/10 py-1 px-2.5 rounded-xl text-background">
                  <ClockIcon size={14} className="text-background shrink-0" />
                  <PlanCountdownTimer expiresAt={activeExpiry} />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 sm:ms-4 flex flex-col items-center justify-center relative">
            {/* <img
              src={badgeImg}
              alt="تخفیف طرح"
              className={cn(
                "size-30 object-contain select-none pointer-events-none drop-shadow-[0_10px_20px_rgba(20,70,80,0.3)]",
              )}
              loading="lazy"
            /> */}
          </div>
        </div>
        {(!isActive || !isCompleted) && (
          <div className="mt-4 rounded-2xl p-4 bg-foreground/90">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-background/70" />
              <span className="text-sm font-semibold text-background">
                شرایط طرح
              </span>
            </div>

            <p className="text-sm leading-7 text-background/75">
              {plan.content ||
                plan.notes ||
                "شرایط این طرح توسط مدیریت تعیین شده است."}
            </p>
          </div>
        )}
        {/* Products included in this Plan */}
        {planProducts.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs pb-0.5">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <BoxIcon size={15} className="text-primary" />
                <span>کالاهای طرح</span>
              </span>
              <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary">
                {toPersianDigits(planProducts.length)} محصول
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {planProducts.map((prod) => {
                const originalPrice = prod.finalCustomerPricePerSqm;
                const discountedPrice = plan.discountPercent
                  ? Math.round(originalPrice * (1 - plan.discountPercent / 100))
                  : originalPrice;

                return (
                  <div
                    key={prod.id}
                    className="h-17 flex items-center !text-background justify-between gap-2.5 p-2 rounded-2xl bg-default/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={prod.images[0] || "/assets/images/placeholder.svg"}
                        alt={prod.name}
                        className="size-12 rounded-2xl object-cover shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (
                            !target.src.endsWith(
                              "/assets/images/placeholder.svg",
                            )
                          ) {
                            target.src = "/assets/images/placeholder.svg";
                          }
                        }}
                      />
                      <div className="min-w-0 flex-1 flex flex-col justify-center">
                        <span className="text-xs font-bold text-background truncate block">
                          {prod.name}
                        </span>
                        {isActive && plan.discountPercent ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted line-through inline-flex items-center gap-0.5">
                              <span>{formatToman(originalPrice)}</span>
                              <TomanIcon className="size-2.5" />
                            </span>
                            <span className="text-xs font-bold text-danger inline-flex items-center gap-0.5">
                              <span>{formatToman(discountedPrice)}</span>
                              <TomanIcon className="size-3" />
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted inline-flex items-center gap-1 mt-0.5">
                            <span>
                              {toPersianDigits(prod.dimension)} ·{" "}
                              {formatToman(originalPrice)}
                            </span>
                            <TomanIcon className="size-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {isActive ? (
                      <Link
                        to="/product"
                        search={{ productname: prod.slug }}
                        className={cn(
                          "h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shrink-0 flex items-center justify-center gap-1 cursor-pointer active:scale-95",
                        )}
                      >
                        <span>سفارش</span>
                        <ArrowLeftIcon size={12} />
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          "h-8 px-2.5 rounded-lg bg-default/20 text-muted text-xs font-semibold shrink-0 flex items-center justify-center gap-1 cursor-not-allowed",
                        )}
                      >
                        <span>منقضی</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer / CTA Section - Pinned to bottom */}
      <div className="mt-auto ">
        {isActive && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs text-muted">
              برای بهره‌مندی از تخفیف و سهمیه این طرح، سفارش خود را ثبت نمایید.
            </span>
            <Link
              to="/product"
              className={cn(
                "h-10 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95",
              )}
            >
              <span>مشاهده محصولات و ثبت سفارش</span>
              <ArrowLeftIcon size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import type { Plan, Product } from "../../types";
import { toPersianDigits, formatToman } from "../../lib/utils/currency";
import { cn } from "../../lib/utils";
import {
  BoxIcon,
  ArrowLeftIcon,
  TomanIcon,
} from "../../components/ui/icons";
import { BellBoldDuotoneIcon } from "@solar-icons/react";

export interface PlanCardProps {
  plan: Plan;
  products: Product[];
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

  return (
    <div
      className={cn(
        "px-4 pt-4 flex flex-col justify-around bg-muted/10 gap-4 text-start transition-all h-full rounded-3xl text-background! relative overflow-hidden",
        !isActive && !isCompleted && "opacity-85",
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="w-full flex gap-1 items-center text-base font-semibold text-foreground leading-snug">
              <BellBoldDuotoneIcon size={36} className="text-yellow-500" />
              <span className="text-base">{plan.title}</span>
            </div>
          </div>

          {/* <div className="shrink-0 sm:ms-4 flex flex-col items-center justify-center relative">
            <img
              src={badgeImg}
              alt="تخفیف طرح"
              className={cn(
                "size-30 object-contain select-none pointer-events-none drop-shadow-[0_10px_20px_rgba(20,70,80,0.3)]",
              )}
              loading="lazy"
            />
          </div> */}
        </div>
        {(!isActive || !isCompleted) && (
          <div className="mt-4 rounded-2xl p-4 bg-blue-500/20">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-foreground/70" />
              <span className="text-sm font-semibold text-foreground">
                شرایط طرح
              </span>
            </div>

            <p className="text-sm leading-7 text-foreground/75">
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

import { Link } from "@tanstack/react-router";
import { Accordion } from "@heroui/react";
import type { Plan, Product } from "../../types";
import { toPersianDigits, formatToman } from "../../lib/utils/currency";
import { formatPersianDate } from "../../lib/utils/date";
import {
  BoxIcon,
  ArrowLeftIcon,
  SparklesIcon,
  TomanIcon,
} from "../../components/ui/icons";

export interface PlanCardProps {
  plan: Plan;
  products: Product[];
}

export function PlanCard({ plan, products }: PlanCardProps) {
  const planProducts = (plan.productIds || [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const isActive =
    plan.status === "active" || (plan.status === undefined && plan.isActive);

  return (
    <div
      className={`pt-2 px-4 flex flex-col justify-between gap-4 text-start transition-all h-full rounded-2xl bg-muted/5 ${
        !isActive ? "opacity-85" : ""
      }`}
    >
      <div className="space-y-5">
        <div className=" flex sm:flex-row flex-col items-start sm:items-center justify-between gap-3">
          <h3 className="text-base sm:text-lg font-bold rounded-2xl text-foreground leading-snug flex items-center gap-1.5 pt-0.5">
            <SparklesIcon
              size={18}
              className={
                isActive ? "text-warning shrink-0" : "text-muted shrink-0"
              }
            />
            <span className="truncate">{plan.title}</span>
          </h3>
          <div className="flex flex-row sm:flex-col sm:items-end h-full justify-between w-full items-start gap-2">
            <span
              className={`px-3 py-1 rounded-2xl text-xs font-semibold  flex items-center gap-1.5 ${
                isActive
                  ? "bg-success/15 text-success"
                  : "text-muted bg-warning/10"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-2xl ${
                  isActive
                    ? "bg-success"
                    : "bg-warning "
                }`}
              />
              <span>{isActive ? "طرح فعال" : "منقضی شده"}</span>
            </span>

            {plan.createdAt && (
              <span className="text-xs text-muted font-medium flex items-center gap-1">
                <span>تاریخ شروع: {formatPersianDate(plan.createdAt)}</span>
              </span>
            )}
          </div>
        </div>
        {isActive ? (
          <div
            className={`p-3.5 rounded-2xl space-y-1 ${
              plan.type === "product_discount"
                ? "bg-success/15"
                : "bg-primary/5"
            }`}
          >
            <div
              className={`text-xs font-bold flex items-center gap-1 ${
                plan.type === "product_discount"
                  ? "text-success"
                  : "text-primary"
              }`}
            >
              <span className="text-sm font-medium">
                {plan.type === "product_discount"
                  ? "شرایط تخفیف:"
                  : "شرایط پرداخت:"}
              </span>
            </div>
            <p className="text-sm font-base text-foreground leading-relaxed whitespace-pre-wrap">
              {plan.content ||
                plan.notes ||
                "شرایط این طرح توسط مدیریت تعیین شده است."}
            </p>
          </div>
        ) : (
          <Accordion className="w-full rounded-2xl" variant="surface">
            <Accordion.Item
              id="plan-terms"
              className="rounded-2xl bg-warning/15 overflow-hidden"
            >
              <Accordion.Heading className="rounded-2xl"> 
                <Accordion.Trigger className="w-full p-3 flex items-center justify-between text-xs font-bold text-warning rounded-2xl transition-colors cursor-pointer">
                  <span className="flex items-center gap-1.5">
              <span className="text-sm font-medium">
                      {plan.type === "product_discount"
                        ? "شرایط تخفیف:"
                        : "شرایط پرداخت:"}
                    </span>
                  </span>
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="p-3 pt-0 text-xs sm:text-sm font-medium text-muted leading-relaxed whitespace-pre-wrap">
                  {plan.content ||
                    plan.notes ||
                    "شرایط این طرح توسط مدیریت تعیین شده است."}
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
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
                const discountedPrice =
                  plan.type === "product_discount"
                    ? Math.round(
                        originalPrice *
                          (1 - (plan.discountPercent || 10) / 100),
                      )
                    : originalPrice;

                return (
                  <div
                    key={prod.id}
                    className="h-17 flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-default/10 transition-colors"
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
                        <span className="text-xs font-bold text-foreground truncate block">
                          {prod.name}
                        </span>
                        {isActive && plan.type === "product_discount" ? (
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
                        className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shrink-0 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span>سفارش</span>
                        <ArrowLeftIcon size={12} />
                      </Link>
                    ) : (
                      <span className="h-8 px-2.5 rounded-lg bg-default/20 text-muted text-xs font-semibold shrink-0 flex items-center justify-center gap-1 cursor-not-allowed">
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
        {isActive ?? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs text-muted">
              برای بهره‌مندی از تخفیف و سهمیه این طرح، سفارش خود را ثبت نمایید.
            </span>
            <Link
              to="/product"
              className="h-10 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
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

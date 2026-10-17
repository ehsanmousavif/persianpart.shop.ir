import { Drawer, Dropdown, ButtonGroup, Button, Label } from "@heroui/react";
import { StarIcon } from "@solar-icons/react/bold/star";
import { useProducts } from "./product-store";
import {
  CheckIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  XIcon,
} from "../../components/ui/icons";
import { toPersianDigits } from "../../lib/utils/currency";
import { cn } from "../../lib/utils";

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productHook?: ReturnType<typeof useProducts>;
  catalogHook?: ReturnType<typeof useProducts>;
}

const AVAILABLE_DIMENSIONS = [
  "30×90",
  "60×120",
  "80×160",
  "100×100",
  "120×240",
  "60×60",
  "30×60",
  "20×120",
];

const AVAILABLE_GRADES = ["درجه ۱", "درجه ۲", "درجه ۳", "درجه ۴"] as const;

const SORT_OPTIONS = [
  { id: "default", label: "پیش‌فرض" },
  { id: "cheapest", label: "ارزان‌ترین" },
  { id: "expensive", label: "گران‌ترین" },
  { id: "newest", label: "جدیدترین" },
  { id: "oldest", label: "قدیمی‌ترین" },
] as const;

export function FilterDrawer({
  isOpen,
  onClose,
  productHook,
  catalogHook,
}: FilterDrawerProps) {
  const hook = productHook || catalogHook!;
  const {
    filters,
    toggleArrayFilter,
    setFilter,
    resetFilters,
    activeFilterCount,
    dimensions,
  } = hook;

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === filters.sortBy)?.label || "پیش‌فرض";

  const allDimensions =
    dimensions && dimensions.length > 0 ? dimensions : AVAILABLE_DIMENSIONS;

  const currentDimLabel = filters.selectedDimension
    ? toPersianDigits(filters.selectedDimension)
    : "همه ابعاد";

  return (
    <Drawer>
      <Drawer.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
        className="fixed z-50 backdrop-blur-xs flex items-end justify-center fade-up transition-all duration-330"
      >
        <Drawer.Content
          placement="bottom"
          className="w-full max-w-lg fixed z-50 bottom-0 top-50 rounded-2xl shadow-2xl flex flex-col  overflow-hidden"
        >
          <Drawer.Dialog className="flex flex-col h-full outline-none text-start">
            <div className="pt-3 pb-1 flex justify-center w-full">
              <Drawer.Handle className="w-12 h-1.5 rounded-full bg-muted/40 transition-colors cursor-grab" />
            </div>

            {/* 2. Drawer Header */}
            <Drawer.Header className="w-full flex items-center justify-between px-5 pt-1 pb-3 border-b border-separator">
              <Drawer.Heading className="text-sm w-full font-extrabold text-foreground flex items-center gap-2">
                <span>فیلترها و مرتب‌سازی</span>
                {activeFilterCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {toPersianDigits(activeFilterCount)}
                  </span>
                )}
              </Drawer.Heading>
              <button
                type="button"
                onClick={onClose}
                aria-label="بستن"
                className="w-7 h-7 rounded-full bg-default/20 hover:bg-default/35 text-muted hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
              >
                <XIcon size={14} />
              </button>
            </Drawer.Header>

            {/* 3. Drawer Body */}
            <Drawer.Body className="overflow-y-auto px-5 py-4 space-y-4">
              {/* Option A: Bolder Toggle Button (Only in Stock) */}
              <div className="py-3 px-4 rounded-2xl bg-muted/5 border border-border/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-foreground block">
                    فقط کالاهای موجود
                  </span>
                  <span className="text-[11px] text-muted font-medium block mt-0.5">
                    عدم نمایش کالاهای ناموجود در انبار
                  </span>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={filters.onlyInStock}
                  onClick={() => setFilter("onlyInStock", !filters.onlyInStock)}
                  className={cn(
                    "w-14 h-7.5 rounded-full transition-colors duration-200 relative cursor-pointer p-0.5 shadow-inner shrink-0",
                    filters.onlyInStock
                      ? "bg-primary ring-2 ring-primary/40"
                      : "bg-default/70 hover:bg-default/90",
                  )}
                >
                  <span
                    className={cn(
                      "w-6.5 h-6.5 rounded-full bg-white shadow-md transition-transform duration-200 block",
                      filters.onlyInStock
                        ? "-translate-x-6.5"
                        : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Option B: Sorting (HeroUI Dropdown) */}

              {/* Option B: Sorting (HeroUI Dropdown) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  مرتب‌سازی بر اساس
                </label>

                <Dropdown>
                  <Button
                    variant="secondary"
                    className="w-full justify-between h-11 px-3.5 rounded-xl border border-border bg-surface text-foreground font-semibold text-xs flex items-center cursor-pointer hover:bg-default/15 transition-colors"
                  >
                    <span>{currentSortLabel}</span>
                    <ChevronDownIcon size={16} className="text-muted" />
                  </Button>

                  <Dropdown.Popover className="w-[calc(100vw-25%)] text-right max-w-md rounded-2xl p-1.5 shadow-xl border border-border bg-surface z-60">
                    <Dropdown.Menu
                      selectionMode="single"
                      selectedKeys={new Set([filters.sortBy || "default"])}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        if (selected) setFilter("sortBy", selected as any);
                      }}
                    >
                      {SORT_OPTIONS.map((opt) => {
                        const isSelected = filters.sortBy === opt.id;

                        return (
                          <Dropdown.Item
                            key={opt.id}
                            id={opt.id}
                            textValue={opt.label}
                            className={cn(
                              "rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between",
                              isSelected
                                ? "bg-primary/15 text-primary"
                                : "hover:bg-default/20",
                            )}
                          >
                            <Label className="cursor-pointer">
                              {opt.label}
                            </Label>
                          </Dropdown.Item>
                        );
                      })}
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-foreground block">
                  ابعاد کاشی و سرامیک
                </label>

                <Dropdown>
                  <Button
                    variant="secondary"
                    className="w-full justify-between h-11 px-3.5 rounded-xl border border-border bg-surface text-foreground font-semibold text-xs flex items-center cursor-pointer hover:bg-default/15 transition-colors"
                  >
                    <span>{currentDimLabel}</span>
                    <ChevronDownIcon size={16} className="text-muted" />
                  </Button>

                  <Dropdown.Popover className="w-[calc(100vw-25%)] max-w-md max-h- rounded-2xl p-1.5 shadow-xl border border-border bg-surface z-60">
                    <Dropdown.Menu
                      selectionMode="single"
                      selectedKeys={
                        new Set([filters.selectedDimension || "all"])
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setFilter(
                          "selectedDimension",
                          !selected || selected === "all" ? null : selected,
                        );
                      }}
                    >
                      <Dropdown.Item
                        id="all"
                        textValue="همه ابعاد"
                        className={cn(
                          "rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between",
                          !filters.selectedDimension
                            ? "bg-primary/15 text-primary"
                            : "hover:bg-default/20",
                        )}
                      >
                        <Label className="cursor-pointer">همه ابعاد</Label>
                      </Dropdown.Item>

                      {allDimensions.map((dim) => {
                        const isSelected = filters.selectedDimension === dim;

                        return (
                          <Dropdown.Item
                            key={dim}
                            id={dim}
                            textValue={dim}
                            className={cn(
                              "rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between",
                              isSelected
                                ? "bg-primary/15 text-primary"
                                : "hover:bg-default/20",
                            )}
                          >
                            <Label className="cursor-pointer">
                              {toPersianDigits(dim)}
                            </Label>
                          </Dropdown.Item>
                        );
                      })}
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </div>

              {/* Option D: Quality Grade (HeroUI ButtonGroup with StarIcon) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <StarIcon size={16} className="text-primary" />
                  <label className="text-xs font-bold text-foreground block">
                    درجه کیفی
                  </label>
                </div>

                <ButtonGroup className="w-full rounded-xl overflow-hidden border border-border/80 shadow-2xs divide-x-reverse divide-x divide-border/60">
                  {AVAILABLE_GRADES.map((grade) => {
                    const isSelected = filters.selectedGrades.includes(grade);
                    return (
                      <Button
                        key={grade}
                        type="button"
                        onPress={() =>
                          toggleArrayFilter("selectedGrades", grade)
                        }
                        className={cn(
                          "flex-1 h-10 px-1 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground font-black shadow-xs"
                            : "bg-surface hover:bg-default/15 text-foreground",
                        )}
                      >
                        <StarIcon
                          size={13}
                          className={
                            isSelected
                              ? "text-primary-foreground"
                              : "text-primary/80"
                          }
                        />
                        <span>{grade}</span>
                      </Button>
                    );
                  })}
                </ButtonGroup>
              </div>
            </Drawer.Body>

            {/* 4. Drawer Footer */}
            <Drawer.Footer className="px-5 py-3 border-t border-border bg-surface grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="py-2.5 px-4 rounded-xl border border-border text-foreground text-xs font-bold hover:bg-default/15 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RefreshCwIcon size={14} />
                <span>پاک کردن</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <CheckIcon size={14} />
                <span>
                  مشاهده نتایج ({toPersianDigits(hook.products.length)})
                </span>
              </button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

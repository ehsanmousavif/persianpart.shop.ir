import { useState, useMemo, useEffect, useRef } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { ScrollShadow, TagGroup, Tag } from '@heroui/react'
import { useCatalog } from '../../features/catalog/catalog-store'
import { ProductCard } from '../../features/catalog/product-card'
import { ProductBottomSheet } from '../../features/catalog/product-bottom-sheet'
import { FilterDrawer } from '../../features/catalog/filter-drawer'
import type { Product } from '../../lib/mock-data/products'
import { useCart } from '../../features/cart/cart-store'
import { useProductSelection } from '../../features/catalog/selection-store'
import { toPersianDigits } from '../../lib/utils/currency'
import { ProductCardSkeleton } from '../../components/ui/skeleton'
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  RefreshCwIcon,
  BoxIcon,
  ArrowLeftIcon,
} from '../../components/ui/icons'

export const Route = createFileRoute('/product/')({
  component: ProductCatalogPage,
})

const CATALOG_DIMENSIONS = [
  '30×90',
  '60×120',
  '80×160',
  '100×100',
  '120×240',
  '60×60',
  '30×60',
  '20×120',
] as const

function ProductCatalogPage() {
  const navigate = useNavigate()
  const catalogHook = useCatalog()
  const { products, allProducts, dimensions, filters, setFilter, resetFilters, activeFilterCount, isLoading } = catalogHook
  const { isProductInCart } = useCart()
  const { selectedIds, toggleProduct, isProductSelected, selectProduct, reconcileWithCatalog } = useProductSelection()

  // Reconcile selected IDs with live catalog products to eliminate any phantom/ghost IDs
  useEffect(() => {
    if (!isLoading && allProducts && allProducts.length > 0) {
      reconcileWithCatalog(allProducts.map((p) => p.id))
    }
  }, [isLoading, allProducts, reconcileWithCatalog])

  // Count only valid selected products
  const selectedCount = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return selectedIds.length
    }
    const catalogSet = new Set(allProducts.map((p) => String(p.id).replace(/["']/g, '').trim()))
    return selectedIds.filter((id) => catalogSet.has(String(id).replace(/["']/g, '').trim())).length
  }, [allProducts, selectedIds])

  const INITIAL_BATCH_SIZE = 12
  const BATCH_STEP = 12
  const LOAD_MORE_DELAY_MS = 500
  const [displayLimit, setDisplayLimit] = useState(INITIAL_BATCH_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTargetRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDisplayLimit(INITIAL_BATCH_SIZE)
  }, [filters])

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeBottomSheetProduct, setActiveBottomSheetProduct] = useState<Product | null>(null)

  const handleOpenBottomSheet = (product: Product) => {
    setActiveBottomSheetProduct(product)
  }

  const handleCloseBottomSheet = () => {
    setActiveBottomSheetProduct(null)
  }

  const handleToggleSelect = (product: Product) => {
    toggleProduct(product.id)
  }


  const activeContainerClass = 'flex flex-col gap-2'

  // Normal in-place selection: Products stay in their original catalog order.
  // When selected, their card highlights and adds to the checkout FAB without moving or pinning.
  const displayedProducts = useMemo(() => {
    return products.slice(0, displayLimit)
  }, [products, displayLimit])

  const hasMore = displayLimit < products.length

  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true)
          setTimeout(() => {
            setDisplayLimit((prev) => Math.min(prev + BATCH_STEP, products.length))
            setIsLoadingMore(false)
          }, LOAD_MORE_DELAY_MS)
        }
      },
      {
        rootMargin: '250px',
        threshold: 0.1,
      }
    )

    const currentTarget = observerTargetRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoadingMore, products.length])

  return (
    <div className="w-full px-3 py-3 space-y-3 text-start pb-32 bg-white">
      {/* 1. Search Bar & Advanced Filters Trigger (Directly on Canvas Background) */}
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilter('searchQuery', e.target.value)}
            placeholder="جستجو در محصولات"
            className="w-full h-13 px-3 ps-9 placeholder:font-bold placeholder:text-[12px] rounded-[12px] bg-white border border-slate-200/90 focus:border-slate-800 text-xs font-semibold text-slate-900 transition-all outline-hidden shadow-2xs flex flex-col justify-center items-center"
            aria-label="جستجوی سریع کاتالوگ"
          />
          <SearchIcon size={16} className="absolute start-3 top-4 text-slate-400 pointer-events-none" />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setFilter('searchQuery', '')}
              className="absolute end-2.5  top-2.5 w-6 h-6 rounded-[12px] text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              aria-label="پاک کردن متن جستجو"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
        {/* 3. Advanced Filter Button (Opens FilterDrawer with sorting, brands, etc.) */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={` px-4 rounded-[12px] border font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-2xs ${
            activeFilterCount > 0
              ? 'bg-blue-50 border-blue-600 text-blue-700'
              : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FilterIcon size={15} />
          {/* <span className="sm:hidden"></span> */}
          {activeFilterCount > 0 && (
            <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
              {toPersianDigits(activeFilterCount)}
            </span>
          )}
        </button>
      </div>

      {/* 2. Dimensions Filter Strip (with ScrollShadow and HeroUI TagGroup) */}
      <ScrollShadow orientation="horizontal" className="w-full overflow-x-auto pb-1 pt-0.5 scrollbar-none">
        <TagGroup
          aria-label="فیلتر ابعاد کاشی و سرامیک"
          selectionMode="single"
          selectedKeys={filters.selectedDimension ? [filters.selectedDimension] : ['all']}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string | undefined
            if (!selected || selected === 'all') {
              setFilter('selectedDimension', null)
            } else {
              setFilter('selectedDimension', selected)
            }
          }}
        >
          <TagGroup.List className="flex items-center gap-1.5 min-w-max">
            <Tag
              id="all"
              className={`h-10 w-fit px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border active:scale-95 shadow-2xs ${
                !filters.selectedDimension
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              همه ابعاد
            </Tag>
            {(dimensions && dimensions.length > 0 ? dimensions : CATALOG_DIMENSIONS).map((dim) => {
              const isSelected = filters.selectedDimension === dim
              return (
                <Tag
                  key={dim}
                  id={dim}
                  className={`h-10 px-4 w-fit rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border active:scale-95 shadow-2xs ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {toPersianDigits(dim)}
                </Tag>
              )
            })}
          </TagGroup.List>
        </TagGroup>
      </ScrollShadow>

      {/* Filter Drawer Component */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        catalogHook={catalogHook}
      />

      {/* Status, Top Badge & View Mode Switcher Bar */}
      <div className="flex items-center justify-between gap-2 px-1 py-1 flex-wrap sm:flex-nowrap">
        {/* Right: Top Badge & Active Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">لیست محصولات</span>
        
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
            >
              حذف همه فیلترها ({toPersianDigits(activeFilterCount)})
            </button>
          )}
        </div>
      </div>

      {/* Product Items Display with Selected View Mode Container */}
      {isLoading ? (
        <div className={activeContainerClass}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} viewMode="list" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center my-4 space-y-2.5 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BoxIcon size={24} />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900">
            محصولی با این مشخصات یافت نشد
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            با تغییر یا حذف فیلترها، مجدداً جستجو کنید.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <RefreshCwIcon size={13} />
            <span>حذف همه فیلترها</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Products in standard unpinned catalog order */}
          <div className={activeContainerClass}>
            {displayedProducts.map((product) => {
              const inCart = isProductInCart(product.id)
              const isSelected = isProductSelected(product.id)

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSelected={isSelected}
                  isInCart={inCart}
                  onToggleSelect={handleToggleSelect}
                  onOpenBottomSheet={handleOpenBottomSheet}
                />
              )
            })}
          </div>

          {/* Infinite Scroll Sentinel & Progressive Loading Indicator */}
          {hasMore && (
            <div ref={observerTargetRef} className="pt-2 space-y-2">
              {isLoadingMore ? (
                <div className={activeContainerClass}>
                  <ProductCardSkeleton viewMode="list" />
                  <ProductCardSkeleton viewMode="list" />
                </div>
              ) : (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoadingMore(true)
                      setTimeout(() => {
                        setDisplayLimit((prev) => Math.min(prev + BATCH_STEP, products.length))
                        setIsLoadingMore(false)
                      }, LOAD_MORE_DELAY_MS)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold py-2 px-4 rounded-xl bg-blue-50/70 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    بارگذاری کالاهای بیشتر ({toPersianDigits(products.length - displayLimit)} مانده)
                  </button>
                </div>
              )}
            </div>
          )}

          {!hasMore && products.length > INITIAL_BATCH_SIZE && (
            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-slate-200" />
              <div className="h-px w-12 bg-slate-200" />
            </div>
          )}
        </div>
      )}

      {/* Prominent Floating Action Bar (FAB) - Positioned Safely ABOVE MobileBottomNav */}
      {selectedCount > 0 && (
        <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-22 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          <Link
            to="/product/new"
            aria-label={`تعیین متراژ و ثبت سفارش ${toPersianDigits(selectedCount)} محصول انتخاب شده`}
            className="h-12 px-5 rounded-full bg-slate-950/95 backdrop-blur-md text-white flex items-center gap-3 shadow-2xl border border-slate-800 ring-1 ring-white/15 cursor-pointer active:scale-95 transition-all select-none touch-manipulation hover:bg-slate-900"
          >
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs">
              {toPersianDigits(selectedCount)}
            </span>
            <span className="text-sm font-bold">ثبت سفارش</span>
            <ArrowLeftIcon size={16} className="text-slate-200" />
          </Link>
        </div>
      )}

      {/* Product Bottom Sheet */}
      <ProductBottomSheet
        product={activeBottomSheetProduct}
        isOpen={Boolean(activeBottomSheetProduct)}
        isSelected={activeBottomSheetProduct ? isProductSelected(activeBottomSheetProduct.id) : false}
        onClose={handleCloseBottomSheet}
        onToggleSelect={activeBottomSheetProduct ? () => handleToggleSelect(activeBottomSheetProduct) : undefined}
        onOrderDirect={(product) => {
          selectProduct(product.id)
          handleCloseBottomSheet()
          navigate({
            to: '/product/new',
          })
        }}
      />
    </div>
  )
}


import { useState, useMemo, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { ScrollShadow, TagGroup, Tag } from '@heroui/react'
import { useProducts } from '../../features/products/product-store'
import { ProductCard } from '../../features/products/product-card'
import { ProductBottomSheet } from '../../features/products/product-bottom-sheet'
import { FilterDrawer } from '../../features/products/filter-drawer'
import type { Product } from '../../types'
import { useCart } from '../../features/cart/cart-store'
import { useProductSelection } from '../../features/products/selection-store'
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
  component: ProductListPage,
})

const PRODUCT_DIMENSIONS = [
  '30×90',
  '60×120',
  '80×160',
  '100×100',
  '120×240',
  '60×60',
  '30×60',
  '20×120',
] as const

function ProductListPage() {
  const navigate = useNavigate()
  const productHook = useProducts()
  const { products, allProducts, dimensions, filters, setFilter, resetFilters, activeFilterCount, isLoading } = productHook
  const { isProductInCart } = useCart()
  const { selectedIds, toggleProduct, isProductSelected, selectProduct, reconcileWithProducts } = useProductSelection()

  // Reconcile selected IDs with live products to eliminate any phantom/ghost IDs
  useEffect(() => {
    if (!isLoading && allProducts && allProducts.length > 0) {
      reconcileWithProducts(allProducts.map((p) => p.id))
    }
  }, [isLoading, allProducts, reconcileWithProducts])

  // Count only valid selected products
  const selectedCount = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return selectedIds.length
    }
    const productSet = new Set(allProducts.map((p) => String(p.id).replace(/["']/g, '').trim()))
    return selectedIds.filter((id) => productSet.has(String(id).replace(/["']/g, '').trim())).length
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

  const handleOpenBottomSheet = useCallback((product: Product) => {
    setActiveBottomSheetProduct(product)
  }, [])

  const handleCloseBottomSheet = useCallback(() => {
    setActiveBottomSheetProduct(null)
  }, [])

  const handleToggleSelect = useCallback((product: Product) => {
    toggleProduct(product.id)
  }, [toggleProduct])

  // Normal in-place selection: Products stay in their original order.
  const displayedProducts = useMemo(() => {
    return products.slice(0, displayLimit)
  }, [products, displayLimit])

  const hasMore = displayLimit < products.length

  const listContainerRef = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    if (listContainerRef.current) {
      setScrollMargin(listContainerRef.current.offsetTop)
    }
  }, [filters])

  useEffect(() => {
    const handleResize = () => {
      if (listContainerRef.current) {
        setScrollMargin(listContainerRef.current.offsetTop)
      }
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: displayedProducts.length,
    estimateSize: () => 104,
    overscan: 5,
    scrollMargin,
    gap: 8,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Auto-load next batch when scrolling near the end of the virtual window
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return

    if (lastItem.index >= displayedProducts.length - 2 && hasMore && !isLoadingMore) {
      setIsLoadingMore(true)
      setTimeout(() => {
        setDisplayLimit((prev) => Math.min(prev + BATCH_STEP, products.length))
        setIsLoadingMore(false)
      }, 200)
    }
  }, [virtualItems, displayedProducts.length, hasMore, isLoadingMore, products.length])

  // Fallback IntersectionObserver sentinel
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
    <div className="w-full px-4 py-3 space-y-3 text-start pb-12 bg-white">
      {/* 1. Search Bar & Advanced Filters Trigger */}
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilter('searchQuery', e.target.value)}
            placeholder="جستجوی کالا، کد یا برند..."
            className="w-full h-13 px-3 ps-9  placeholder:text-sm rounded-xl bg-surface border border-border focus:border-primary text-xs font-semibold text-foreground transition-all outline-hidden shadow-2xs flex flex-col justify-center items-center"
            aria-label="جستجوی سریع محصولات"
          />
          <SearchIcon size={16} className="absolute start-s-3 top-4 text-muted pointer-events-none" />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setFilter('searchQuery', '')}
              className="absolute end-s-2.5  top-2.5 w-6 h-6 rounded-3xl text-muted hover:text-foreground flex items-center justify-center cursor-pointer"
              aria-label="پاک کردن متن جستجو"
            >
              <XIcon size={14} />
            </button>
          )}
        </div>
        {/* 2. Advanced Filter Button */}
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={` px-4 rounded-[12px] border font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-2xs ${
            activeFilterCount > 0
              ? 'bg-primary/15 border-primary text-primary'
              : 'bg-surface border-border text-foreground hover:bg-default/20'
          }`}
        >
          <FilterIcon size={15} />
          {activeFilterCount > 0 && (
            <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-xs">
              {toPersianDigits(activeFilterCount)}
            </span>
          )}
        </button>
      </div>

      {/* 3. Dimensions Filter Strip */}
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
              className={`h-10 w-fit px-4 text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border active:scale-95 shadow-2xs ${
                !filters.selectedDimension
                  ? 'bg-foreground border-foreground text-background'
                  : 'bg-surface border-border text-muted hover:bg-default/20 hover:text-foreground'
              }`}
            >
              همه
            </Tag>
            {(dimensions && dimensions.length > 0 ? dimensions : PRODUCT_DIMENSIONS).map((dim) => {
              const isSelected = filters.selectedDimension === dim
              return (
                <Tag
                  key={dim}
                  id={dim}
                  className={`h-10 px-4 w-fit rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border active:scale-95 shadow-2xs ${
                    isSelected
                      ? 'bg-foreground border-foreground text-background'
                      : 'bg-surface border-border text-muted hover:bg-default/20 hover:text-foreground'
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
        productHook={productHook}
      />

      {/* Status & Active Count */}
      <div className="flex items-center justify-between gap-2 px-1 py-1 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">لیست محصولات</span>
        
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-danger hover:underline cursor-pointer"
            >
              پاک کردن فیلترها ({toPersianDigits(activeFilterCount)})
            </button>
          )}
        </div>
      </div>

      {/* Product Items Display */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} viewMode="list" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center my-4 space-y-2.5 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-default/20 text-muted flex items-center justify-center mx-auto">
            <BoxIcon size={24} />
          </div>
          <h3 className="text-sm font-extrabold text-foreground">
            محصولی با این مشخصات یافت نشد
          </h3>
          <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
            با تغییر یا حذف فیلترها، مجدداً جستجو کنید.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <RefreshCwIcon size={13} />
            <span>پاک کردن فیلترها</span>
          </button>
        </div>
      ) : (
        <div className="w-full">
          <div
            ref={listContainerRef}
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const product = displayedProducts[virtualRow.index]
              if (!product) return null

              const inCart = isProductInCart(product.id)
              const isSelected = isProductSelected(product.id)

              return (
                <div
                  key={product.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                  }}
                >
                  <ProductCard
                    product={product}
                    isSelected={isSelected}
                    isInCart={inCart}
                    onToggleSelect={handleToggleSelect}
                    onOpenBottomSheet={handleOpenBottomSheet}
                  />
                </div>
              )
            })}
          </div>

          {/* Infinite Scroll Sentinel */}
          {hasMore && (
            <div ref={observerTargetRef} className="pt-4 space-y-2">
              {isLoadingMore ? (
                <div className="flex flex-col gap-2">
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
                    className="text-xs text-primary hover:text-primary/90 font-bold py-2 px-4 rounded-xl bg-primary/15 hover:bg-primary/25 transition-all cursor-pointer"
                  >
                    نمایش بیشتر ({toPersianDigits(products.length - displayLimit)} کالا)
                  </button>
                </div>
              )}
            </div>
          )}

         
        </div>
      )}

      {/* Floating Action Bar (FAB) */}
      {selectedCount > 0 && (
        <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-22 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          <Link
            to="/product/new"
            aria-label={`تعیین متراژ و ثبت سفارش ${toPersianDigits(selectedCount)} محصول انتخاب شده`}
            className="h-12 px-5 rounded-full bg-foreground/95 backdrop-blur-md text-background flex items-center gap-3 shadow-2xl border border-border ring-1 ring-background/15 cursor-pointer active:scale-95 transition-all select-none touch-manipulation hover:bg-foreground"
          >
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-success text-success-foreground font-bold text-xs flex items-center justify-center shadow-xs">
              {toPersianDigits(selectedCount)}
            </span>
            <span className="text-sm font-bold">ثبت سفارش</span>
            <ArrowLeftIcon size={16} className="text-background/80" />
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

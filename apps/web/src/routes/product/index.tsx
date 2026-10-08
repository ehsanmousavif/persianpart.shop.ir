import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useCatalog } from '../../features/catalog/catalog-store'
import { ProductCard } from '../../features/catalog/product-card'
import { ProductBottomSheet } from '../../features/catalog/product-bottom-sheet'
import { FilterDrawer } from '../../features/catalog/filter-drawer'
import type { Product } from '../../lib/mock-data/products'
import { useCart } from '../../features/cart/cart-store'
import { toPersianDigits } from '../../lib/utils/currency'
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  RefreshCwIcon,
  BoxIcon,
  ArrowLeftIcon,
} from '../../components/ui/icons'

interface ProductSearch {
  productname?: string
  selected?: string
}

export const Route = createFileRoute('/product/')({
  validateSearch: (search: Record<string, unknown>): ProductSearch => {
    return {
      productname: typeof search.productname === 'string' ? search.productname : undefined,
      selected: typeof search.selected === 'string' ? search.selected : undefined,
    }
  },
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
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const catalogHook = useCatalog()
  const { products, allProducts, filters, setFilter, resetFilters, activeFilterCount } = catalogHook
  const { isProductInCart } = useCart()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    if (searchParams.selected) {
      return searchParams.selected
        .split(',')
        .map((s) => s.replace(/["']/g, '').trim())
        .filter(Boolean)
    }
    try {
      const saved = localStorage.getItem('persianpart_selected_products')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          return parsed.map((s: any) => String(s).replace(/["']/g, '').trim()).filter(Boolean)
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    return []
  })

  // Synchronize selection state to localStorage for robust mobile session persistence
  useEffect(() => {
    try {
      localStorage.setItem('persianpart_selected_products', JSON.stringify(selectedProductIds))
    } catch {
      // Ignore localStorage errors
    }
  }, [selectedProductIds])

  // URL-driven Bottom Sheet state
  const activeBottomSheetProduct = useMemo(() => {
    if (!searchParams.productname) return null
    return (
      allProducts.find(
        (p) => p.slug === searchParams.productname || p.sku === searchParams.productname
      ) || null
    )
  }, [searchParams.productname, allProducts])

  const handleOpenBottomSheet = (product: Product) => {
    navigate({
      search: (prev) => ({
        ...prev,
        productname: product.slug,
      }),
    })
  }

  const handleCloseBottomSheet = () => {
    navigate({
      search: (prev) => {
        const { productname: _p, ...rest } = prev
        return rest
      },
    })
  }

  const handleToggleSelect = (product: Product) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id)
      } else {
        // Appends to selection order
        return [...prev, product.id]
      }
    })
  }


  // Pinning logic: Selected products pinned to the top in the order they were selected.
  // When deselected, they return naturally to the unselected list.
  const { pinnedProducts, unselectedProducts } = useMemo(() => {
    const pinned = selectedProductIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined)

    const unselected = products.filter(
      (p) => !selectedProductIds.includes(p.id)
    )

    return { pinnedProducts: pinned, unselectedProducts: unselected }
  }, [selectedProductIds, products, allProducts])

  return (
    <div className="w-full px-3 py-3 space-y-3 text-start pb-32">
      {/* 1. Search Bar & Advanced Filters Trigger (Directly on Canvas Background) */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilter('searchQuery', e.target.value)}
            placeholder="جستجوی کالا، ابعاد (۳۰×۹۰)، کد SKU یا برند..."
            className="w-full h-11 px-3 ps-9 rounded-2xl bg-white border border-slate-200/90 focus:border-slate-800 text-xs font-semibold text-slate-900 transition-all outline-hidden shadow-2xs"
            aria-label="جستجوی سریع کاتالوگ"
          />
          <SearchIcon size={16} className="absolute start-3 top-3.5 text-slate-400 pointer-events-none" />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setFilter('searchQuery', '')}
              className="absolute end-2.5 top-2.5 w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
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
          className={`h-11 px-3 sm:px-4 rounded-2xl border font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 shadow-2xs ${
            activeFilterCount > 0
              ? 'bg-blue-50 border-blue-600 text-blue-700'
              : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FilterIcon size={15} />
          <span className="hidden sm:inline">فیلترهای پیشرفته</span>
          <span className="sm:hidden">فیلترها</span>
          {activeFilterCount > 0 && (
            <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
              {toPersianDigits(activeFilterCount)}
            </span>
          )}
        </button>
      </div>

      {/* 2. Dimensions Filter Strip (Replaces sorting row and sits directly on canvas background) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter('selectedDimension', null)}
          className={`h-8 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border active:scale-95 shadow-2xs ${
            !filters.selectedDimension
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          همه ابعاد
        </button>
        {CATALOG_DIMENSIONS.map((dim) => {
          const isSelected = filters.selectedDimension === dim
          return (
            <button
              key={dim}
              type="button"
              onClick={() => setFilter('selectedDimension', isSelected ? null : dim)}
              className={`h-8 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border active:scale-95 shadow-2xs ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {toPersianDigits(dim)}
            </button>
          )
        })}
      </div>

      {/* Filter Drawer Component */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        catalogHook={catalogHook}
      />

      {/* Status & Counter Bar */}
      <div className="px-1 text-xs text-slate-500 flex items-center justify-between">
        <span className="font-bold text-slate-700">{toPersianDigits(products.length)} کالا</span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
          >
            حذف همه فیلترها
          </button>
        )}
      </div>

      {/* Product Items Display: Compact Vertical List */}
      {products.length === 0 ? (
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
        <div className="flex flex-col gap-2">
          {/* 1. Pinned Selected Products (in selection order) */}
          {pinnedProducts.length > 0 && (
            <div className="space-y-2 pb-1">
              <div className="flex items-center justify-between px-1 text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  محصولات انتخاب‌شده:
                </span>
                <span className="text-xs text-slate-400">
                  {toPersianDigits(pinnedProducts.length)} مورد
                </span>
              </div>

              {pinnedProducts.map((product) => (
                <ProductCard
                  key={`pinned-${product.id}`}
                  product={product}
                  isSelected={true}
                  isInCart={isProductInCart(product.id)}
                  onToggleSelect={handleToggleSelect}
                  onOpenBottomSheet={handleOpenBottomSheet}
                />
              ))}

              {unselectedProducts.length > 0 && (
                <div className="flex items-center gap-2 pt-2 pb-0.5 px-1">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-xs font-medium text-slate-400">سایر محصولات</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>
              )}
            </div>
          )}

          {/* 2. Unselected Products (sorted and filtered) */}
          {unselectedProducts.map((product) => {
            const inCart = isProductInCart(product.id)

            return (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={false}
                isInCart={inCart}
                onToggleSelect={handleToggleSelect}
                onOpenBottomSheet={handleOpenBottomSheet}
              />
            )
          })}
        </div>
      )}

      {/* Prominent Floating Action Bar (FAB) - Positioned Safely ABOVE MobileBottomNav */}
      {selectedProductIds.length > 0 && (
        <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-22 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          <Link
            to="/product/new"
            search={{
              selected: selectedProductIds.join(','),
            }}
            aria-label={`تعیین متراژ و ثبت سفارش ${toPersianDigits(selectedProductIds.length)} محصول انتخاب شده`}
            className="h-12 px-5 rounded-full bg-slate-950/95 backdrop-blur-md text-white flex items-center gap-3 shadow-2xl border border-slate-800 ring-1 ring-white/15 cursor-pointer active:scale-95 transition-all select-none touch-manipulation hover:bg-slate-900"
          >
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs">
              {toPersianDigits(selectedProductIds.length)}
            </span>
            <span className="text-sm font-bold">تعیین متراژ و ثبت سفارش</span>
            <ArrowLeftIcon size={16} className="text-slate-200" />
          </Link>
        </div>
      )}

      {/* URL-driven Product Bottom Sheet (/product?productname=...) */}
      <ProductBottomSheet
        product={activeBottomSheetProduct}
        isOpen={Boolean(activeBottomSheetProduct)}
        isSelected={activeBottomSheetProduct ? selectedProductIds.includes(activeBottomSheetProduct.id) : false}
        onClose={handleCloseBottomSheet}
        onToggleSelect={activeBottomSheetProduct ? () => handleToggleSelect(activeBottomSheetProduct) : undefined}
        onOrderDirect={(product) => {
          handleCloseBottomSheet()
          navigate({
            to: '/product/new',
            search: {
              selected: product.id,
            },
          })
        }}
      />
    </div>
  )
}

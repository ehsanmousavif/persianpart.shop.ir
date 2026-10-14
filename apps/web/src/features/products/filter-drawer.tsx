import React from 'react'
import { Modal } from '../../components/ui/modal'
import { useProducts } from './product-store'
import { CheckIcon, RefreshCwIcon } from '../../components/ui/icons'
import { toPersianDigits } from '../../lib/utils/currency'

export interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  productHook?: ReturnType<typeof useProducts>
  catalogHook?: ReturnType<typeof useProducts>
}

const AVAILABLE_DIMENSIONS = ['30×90', '60×120', '80×160', '100×100', '60×60', '30×60', '20×120', '120×240']
const AVAILABLE_BRANDS = ['تکسرام', 'کاشی تبریز', 'سینا کاشی', 'سرامیک پالرمو', 'پارس سرام']
const AVAILABLE_COLORS = ['سفید کلکته', 'سفید مرمری', 'خاکستری تیره', 'کرم روشن', 'مشکی مارکینا', 'طوسی تیره']
const AVAILABLE_GRADES = ['درجه ۱', 'درجه ۲', 'درجه ۳', 'درجه ۴', 'صادراتی'] as const
const AVAILABLE_TAGS = ['نانو پولیش', 'رکتیفاید', 'بدون بند', 'صادراتی', 'ضد لغزش (R10)', 'اقتصادی', 'سوپر نانو پولیش', 'مگا اسلب']

export function FilterDrawer({ isOpen, onClose, productHook, catalogHook }: FilterDrawerProps) {
  const hook = productHook || catalogHook!
  const { filters, toggleArrayFilter, setFilter, resetFilters, activeFilterCount, dimensions } = hook

  const FilterSection = ({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) => (
    <div className="py-3 border-b border-separator last:border-0 text-start">
      <h4 className="text-xs font-bold text-foreground mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )

  const content = (
    <div className="space-y-1">
      {/* Stock Toggle */}
      <div className="py-3 border-b border-separator flex items-center justify-between text-start">
        <div>
          <span className="text-xs font-bold text-foreground block">فقط کالاهای موجود</span>
        </div>
        <button
          type="button"
          onClick={() => setFilter('onlyInStock', !filters.onlyInStock)}
          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
            filters.onlyInStock ? 'bg-primary' : 'bg-default/40'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full bg-surface transition-transform absolute top-1 ${
              filters.onlyInStock ? 'end-1' : 'start-1'
            }`}
          />
        </button>
      </div>

      {/* Sort Options */}
      <FilterSection title="مرتب‌سازی">
        {[
          { id: 'default', label: 'پیش‌فرض' },
          { id: 'cheapest', label: 'ارزان‌ترین' },
          { id: 'expensive', label: 'گران‌ترین' },
          { id: 'newest', label: 'جدیدترین' },
          { id: 'oldest', label: 'قدیمی‌ترین' },
        ].map((opt) => {
          const isSelected = filters.sortBy === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter('sortBy', opt.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground font-bold'
                  : 'bg-default/10 hover:bg-default/20 border-border text-foreground'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </FilterSection>

      {/* Structured Dimensions (Single Selection) */}
      <FilterSection title="ابعاد">
        <button
          type="button"
          onClick={() => setFilter('selectedDimension', null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            !filters.selectedDimension
              ? 'bg-primary border-primary text-primary-foreground font-bold'
              : 'bg-default/10 hover:bg-default/20 border-border text-foreground'
          }`}
        >
          همه
        </button>
        {(dimensions && dimensions.length > 0 ? dimensions : AVAILABLE_DIMENSIONS).map((dim) => {
          const isSelected = filters.selectedDimension === dim
          return (
            <button
              key={dim}
              type="button"
              onClick={() => setFilter('selectedDimension', isSelected ? null : dim)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'bg-default/10 hover:bg-default/20 border-border text-foreground'
              }`}
            >
              {toPersianDigits(dim)}
            </button>
          )
        })}
      </FilterSection>

      {/* Brands */}
      <FilterSection title="برند">
        {AVAILABLE_BRANDS.map((brand) => {
          const isSelected = filters.selectedBrands.includes(brand)
          return (
            <button
              key={brand}
              type="button"
              onClick={() => toggleArrayFilter('selectedBrands', brand)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'bg-default/10 hover:bg-default/20 border-border text-foreground'
              }`}
            >
              {brand}
            </button>
          )
        })}
      </FilterSection>

      {/* Colors */}
      <FilterSection title="رنگ">
        {AVAILABLE_COLORS.map((col) => {
          const isSelected = filters.selectedColors.includes(col)
          return (
            <button
              key={col}
              type="button"
              onClick={() => toggleArrayFilter('selectedColors', col)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'bg-default/10 hover:bg-default/20 border-border text-foreground'
              }`}
            >
              {col}
            </button>
          )
        })}
      </FilterSection>

      {/* Grades */}
      <FilterSection title="درجه کیفی">
        {AVAILABLE_GRADES.map((grade) => {
          const isSelected = filters.selectedGrades.includes(grade)
          return (
            <button
              key={grade}
              type="button"
              onClick={() => toggleArrayFilter('selectedGrades', grade)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary font-bold'
                  : 'bg-default/10 hover:bg-default/20 border-border text-foreground'
              }`}
            >
              {grade}
            </button>
          )
        })}
      </FilterSection>

      {/* Tags (Independent lightweight grouping) */}
      <FilterSection title="ویژگی‌ها">
        {AVAILABLE_TAGS.map((tag) => {
          const isSelected = filters.selectedTags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleArrayFilter('selectedTags', tag)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground font-bold'
                  : 'bg-default/10 hover:bg-default/20 border-border text-foreground'
              }`}
            >
              #{tag}
            </button>
          )
        })}
      </FilterSection>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`فیلترها ${activeFilterCount > 0 ? `(${toPersianDigits(activeFilterCount)})` : ''}`}
      isBottomSheetOnMobile={true}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">{content}</div>
        <div className="pt-4 mt-2 border-t border-border grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={resetFilters}
            className="py-2.5 px-4 rounded-xl border border-border text-foreground text-xs font-bold hover:bg-default/15 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCwIcon size={14} />
            <span>پاک کردن فیلترها</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckIcon size={14} />
            <span>اعمال فیلتر ({toPersianDigits(hook.products.length)})</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

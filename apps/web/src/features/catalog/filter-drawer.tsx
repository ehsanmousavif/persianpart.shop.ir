import React from 'react'
import { Modal } from '../../components/ui/modal'
import { useCatalog } from './catalog-store'
import { CheckIcon, RefreshCwIcon } from '../../components/ui/icons'
import { toPersianDigits } from '../../lib/utils/currency'

export interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  catalogHook: ReturnType<typeof useCatalog>
}

const AVAILABLE_DIMENSIONS = ['30×90', '60×120', '80×160', '100×100', '60×60', '30×60', '20×120', '120×240']
const AVAILABLE_BRANDS = ['تکسرام', 'کاشی تبریز', 'سینا کاشی', 'سرامیک پالرمو', 'پارس سرام']
const AVAILABLE_COLORS = ['سفید کلکته', 'سفید مرمری', 'خاکستری تیره', 'کرم روشن', 'مشکی مارکینا', 'طوسی تیره']
const AVAILABLE_FINISHES = ['پولیش', 'مات', 'براق', 'شوگر', 'رستیک'] as const
const AVAILABLE_GRADES = ['صادراتی', 'درجه ۱', 'درجه ۲'] as const
const AVAILABLE_TAGS = ['نانو پولیش', 'رکتیفاید', 'بدون بند', 'صادراتی', 'ضد لغزش (R10)', 'اقتصادی', 'سوپر نانو پولیش', 'مگا اسلب']

export function FilterDrawer({ isOpen, onClose, catalogHook }: FilterDrawerProps) {
  const { filters, toggleArrayFilter, setFilter, resetFilters, activeFilterCount } = catalogHook

  const FilterSection = ({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) => (
    <div className="py-3 border-b border-slate-100 last:border-0 text-start">
      <h4 className="text-xs font-black text-slate-800 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )

  const content = (
    <div className="space-y-1">
      {/* Stock Toggle */}
      <div className="py-3 border-b border-slate-100 flex items-center justify-between text-start">
        <div>
          <span className="text-xs font-bold text-slate-900 block">فقط کالاهای موجود در انبار</span>
          <span className="text-[11px] text-slate-500">پنهان‌سازی کالاهای ناموجود یا بدون سهمیه</span>
        </div>
        <button
          type="button"
          onClick={() => setFilter('onlyInStock', !filters.onlyInStock)}
          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
            filters.onlyInStock ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
              filters.onlyInStock ? 'end-1' : 'start-1'
            }`}
          />
        </button>
      </div>

      {/* Sort Options */}
      <FilterSection title="مرتب‌سازی کالاها">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </FilterSection>

      {/* Structured Dimensions (Single Selection) */}
      <FilterSection title="ابعاد ساختاریافته تایل (انتخاب تک‌گزینه‌ای)">
        <button
          type="button"
          onClick={() => setFilter('selectedDimension', null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            !filters.selectedDimension
              ? 'bg-blue-600 border-blue-600 text-white font-bold'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          همه ابعاد
        </button>
        {AVAILABLE_DIMENSIONS.map((dim) => {
          const isSelected = filters.selectedDimension === dim
          return (
            <button
              key={dim}
              type="button"
              onClick={() => setFilter('selectedDimension', isSelected ? null : dim)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {toPersianDigits(dim)}
            </button>
          )
        })}
      </FilterSection>

      {/* Brands */}
      <FilterSection title="برند و کارخانه سازنده">
        {AVAILABLE_BRANDS.map((brand) => {
          const isSelected = filters.selectedBrands.includes(brand)
          return (
            <button
              key={brand}
              type="button"
              onClick={() => toggleArrayFilter('selectedBrands', brand)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {brand}
            </button>
          )
        })}
      </FilterSection>

      {/* Finishes */}
      <FilterSection title="پوشش لعاب (Finish)">
        {AVAILABLE_FINISHES.map((finish) => {
          const isSelected = filters.selectedFinishes.includes(finish)
          return (
            <button
              key={finish}
              type="button"
              onClick={() => toggleArrayFilter('selectedFinishes', finish)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {finish}
            </button>
          )
        })}
      </FilterSection>

      {/* Colors */}
      <FilterSection title="طیف رنگی">
        {AVAILABLE_COLORS.map((col) => {
          const isSelected = filters.selectedColors.includes(col)
          return (
            <button
              key={col}
              type="button"
              onClick={() => toggleArrayFilter('selectedColors', col)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {col}
            </button>
          )
        })}
      </FilterSection>

      {/* Grades */}
      <FilterSection title="درجه کیفی (Grade)">
        {AVAILABLE_GRADES.map((grade) => {
          const isSelected = filters.selectedGrades.includes(grade)
          return (
            <button
              key={grade}
              type="button"
              onClick={() => toggleArrayFilter('selectedGrades', grade)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {grade}
            </button>
          )
        })}
      </FilterSection>

      {/* Tags (Independent lightweight grouping) */}
      <FilterSection title="تگ‌ها و ویژگی‌ها">
        {AVAILABLE_TAGS.map((tag) => {
          const isSelected = filters.selectedTags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleArrayFilter('selectedTags', tag)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white font-bold'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
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
      title={`فیلترهای پیشرفته ${activeFilterCount > 0 ? `(${toPersianDigits(activeFilterCount)})` : ''}`}
      isBottomSheetOnMobile={true}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">{content}</div>
        <div className="pt-4 mt-2 border-t border-slate-200 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={resetFilters}
            className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCwIcon size={14} />
            <span>حذف فیلترها</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckIcon size={14} />
            <span>مشاهده نتایج ({toPersianDigits(catalogHook.products.length)})</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

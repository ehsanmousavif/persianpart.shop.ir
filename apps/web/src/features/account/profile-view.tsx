import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Modal as HeroUIModal } from '@heroui/react'
import { useAuth } from '../auth/auth-store'
import { toPersianDigits } from '../../lib/utils/currency'
import { toast } from '../../components/feedback/toast'
import {
  UserIcon,
  StoreIcon,
  PhoneIcon,
  MapPinIcon,
  LogOutIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  LockIcon,
} from '../../components/ui/icons'

export function ProfileView() {
  const navigate = useNavigate()
  const { user, logout, updateProfile } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Local form state for draft changes
  const [formData, setFormData] = useState({
    name: user?.name || '',
    storeName: user?.storeName || '',
    economicCode: user?.economicCode || '',
    province: user?.province || '',
    city: user?.city || '',
    address: user?.address || '',
  })

  if (!user) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
        <AlertCircleIcon size={36} className="text-slate-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">حساب کاربری یافت نشد</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">جهت مشاهده حساب کاربری لطفاً وارد سامانه شوید.</p>
        <button
          type="button"
          onClick={() => navigate({ to: '/login' })}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
        >
          ورود به حساب کاربری
        </button>
      </div>
    )
  }

  const handleStartEdit = () => {
    setFormData({
      name: user.name,
      storeName: user.storeName,
      economicCode: user.economicCode || '',
      province: user.province || '',
      city: user.city || '',
      address: user.address || '',
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setFormData({
      name: user.name,
      storeName: user.storeName,
      economicCode: user.economicCode || '',
      province: user.province || '',
      city: user.city || '',
      address: user.address || '',
    })
    setIsEditing(false)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.warning('نام و نام خانوادگی الزامی است.')
      return
    }

    if (!formData.storeName.trim()) {
      toast.warning('عنوان فروشگاه یا شرکت الزامی است.')
      return
    }

    updateProfile({
      name: formData.name.trim(),
      storeName: formData.storeName.trim(),
      economicCode: formData.economicCode.trim(),
      province: formData.province.trim(),
      city: formData.city.trim(),
      address: formData.address.trim(),
    })

    toast.success('تغییرات ذخیره شد', 'اطلاعات حساب کاربری با موفقیت به‌روزرسانی گردید.')
    setIsEditing(false)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    logout()
    toast.info('خروج از حساب', 'از حساب کاربری خود خارج شدید.')
    navigate({ to: '/login' })
  }

  return (
    <div className="space-y-3.5 w-full">
      {/* User Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center text-base font-bold shadow-xs shrink-0">
            {user.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                همکار B2B
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <StoreIcon size={12} className="text-slate-400 shrink-0" />
              <span className="truncate max-w-[200px]">{user.storeName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="h-8 px-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            aria-label="خروج از حساب"
          >
            <LogOutIcon size={14} />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Main Profile Content: Edit Form vs View Mode */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="bg-white border border-blue-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <PencilIcon size={14} />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                ویرایش اطلاعات حساب کاربری
              </h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              حالت ویرایش
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Representative Name */}
            <div className="space-y-1 text-start">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <UserIcon size={13} className="text-slate-400" />
                <span>نام نماینده / مدیر خرید</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="مثال: آرش دهقان"
              />
            </div>

            {/* Store Name */}
            <div className="space-y-1 text-start">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <StoreIcon size={13} className="text-slate-400" />
                <span>عنوان فروشگاه / شرکت حقوقی</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData((prev) => ({ ...prev, storeName: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                placeholder="مثال: پخش بازرگانی پرشین پارت"
              />
            </div>

            {/* Phone Number - Strictly Non-Editable */}
            <div className="space-y-1 text-start">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <PhoneIcon size={13} className="text-slate-400" />
                  <span>شماره تلفن همراه</span>
                </label>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <LockIcon size={10} className="text-slate-400" />
                  <span>غیرقابل تغییر</span>
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-slate-100/90 border border-slate-200 rounded-xl text-slate-600 select-none">
                <span className="text-xs font-bold tracking-wider" dir="ltr">
                  {toPersianDigits(user.phone)}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-lg border border-slate-200/60 shadow-2xs">
                  <LockIcon size={11} className="text-slate-400" />
                  <span>شناسه هویتی ثابت</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed pt-0.5">
                شماره همراه شناسه یکتای حساب شماست و امکان ویرایش یا تغییر آن وجود ندارد.
              </p>
            </div>

            {/* Economic / National Code */}
            <div className="space-y-1 text-start">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <ShieldCheckIcon size={14} className="text-slate-400" />
                <span>شناسه ملی / کد اقتصادی</span>
              </label>
              <input
                type="text"
                dir="ltr"
                value={formData.economicCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, economicCode: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-start"
                placeholder="مثال: 411589324156"
              />
            </div>

            {/* Province & City */}
            <div className="grid grid-cols-2 gap-2.5 text-start">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPinIcon size={14} className="text-slate-400" />
                  <span>استان</span>
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="تهران"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPinIcon size={14} className="text-slate-400" />
                  <span>شهر</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder="تهران"
                />
              </div>
            </div>

            {/* Delivery Warehouse Address */}
            <div className="space-y-1 text-start">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPinIcon size={14} className="text-slate-400" />
                <span>نشانی دقیق انبار بارگیری و تخلیه بار</span>
              </label>
              <textarea
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all leading-relaxed"
                placeholder="نشانی کامل انبار یا محل تخلیه بار..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <CheckIcon size={15} />
              <span>ذخیره تغییرات</span>
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <XIcon size={15} />
              <span>انصراف</span>
            </button>
          </div>
        </form>
      ) : (
        /* View Mode Card */
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            <UserIcon size={17} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <span className="text-xs font-semibold text-slate-500 block">نام نماینده / مدیر خرید</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">{user.name}</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            <StoreIcon size={17} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <span className="text-xs font-semibold text-slate-500 block">عنوان فروشگاه / شرکت حقوقی</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">{user.storeName}</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            <PhoneIcon size={17} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 block">شماره تلفن همراه</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <LockIcon size={11} className="text-emerald-600" />
                  <span>احراز شده (ثابت)</span>
                </span>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-wider mt-0.5 block" dir="ltr">
                {toPersianDigits(user.phone)}
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            <ShieldCheckIcon size={17} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <span className="text-xs font-semibold text-slate-500 block">شناسه ملی / کد اقتصادی</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">
                {toPersianDigits(user.economicCode || 'ثبت نشده')}
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            <MapPinIcon size={17} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <span className="text-xs font-semibold text-slate-500 block">نشانی انبار تحویل و بارگیری</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed block mt-0.5">
                {user.address}
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-1">
                استان {user.province}، شهر {user.city}
              </span>
            </div>
          </div>

          {/* Quick Edit CTA Footer inside View Card */}
          <div className="p-3 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">برای تغییر مشخصات یا نشانی بارگیری:</span>
            <button
              type="button"
              onClick={handleStartEdit}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <PencilIcon size={13} />
              <span>ویرایش اطلاعات</span>
            </button>
          </div>
        </div>
      )}

      {/* HeroUI Logout Confirmation Modal */}
      <HeroUIModal.Root isOpen={showLogoutConfirm} onOpenChange={(open) => !open && setShowLogoutConfirm(false)}>
        <HeroUIModal.Backdrop
          isDismissable
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop-enter"
        >
          <HeroUIModal.Container className="pointer-events-none w-full max-w-sm h-auto p-0 flex flex-col items-center">
            <HeroUIModal.Dialog className="pointer-events-auto relative w-full bg-white rounded-3xl shadow-2xl flex flex-col z-10 border border-slate-200 overflow-hidden animate-modal-enter text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <LogOutIcon size={24} />
              </div>
              <div>
                <HeroUIModal.Heading className="text-base font-bold text-slate-900">
                  خروج از حساب کاربری
                </HeroUIModal.Heading>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  آیا از خروج از حساب کاربری همکاران اطمینان دارید؟
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer transition-all"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition-all"
                >
                  تأیید خروج
                </button>
              </div>
            </HeroUIModal.Dialog>
          </HeroUIModal.Container>
        </HeroUIModal.Backdrop>
      </HeroUIModal.Root>
    </div>
  )
}

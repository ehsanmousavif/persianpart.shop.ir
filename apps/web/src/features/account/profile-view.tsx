import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Modal as HeroUIModal,
  Fieldset,
  FieldGroup,
  TextField,
  Label,
  Input,
  TextArea,
} from '@heroui/react'
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
      <div className="bg-surface border border-border rounded-2xl p-8 text-center max-w-md mx-auto my-12">
        <AlertCircleIcon size={36} className="text-muted mx-auto mb-3" />
        <h3 className="text-base font-bold text-foreground">حساب کاربری یافت نشد</h3>
        <p className="text-xs text-muted mt-1 mb-5">جهت مشاهده حساب کاربری لطفاً وارد سامانه شوید.</p>
        <button
          type="button"
          onClick={() => navigate({ to: '/login' })}
          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs cursor-pointer"
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
      <div className="bg-surface border border-border rounded-2xl p-3.5 sm:p-4  flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-base font-bold  shrink-0">
            {user.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-foreground">{user.name}</h2>
            </div>
            <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
              <StoreIcon size={12} className="text-muted shrink-0" />
              <span className="truncate max-w-[200px]">{user.storeName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="h-8 px-2.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            aria-label="خروج از حساب"
          >
            <LogOutIcon size={14} />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Main Profile Content: Edit Form vs View Mode */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="bg-surface border border-primary/30 rounded-2xl p-4 sm:p-5">
          <Fieldset className="space-y-4">
            <Fieldset.Legend className="w-full">
              <div className="flex items-center justify-between pb-3 border-b border-border w-full">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <PencilIcon size={14} />
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    ویرایش اطلاعات حساب کاربری
                  </span>
                </div>
                <span className="text-xs font-semibold text-warning bg-warning/15 px-2 py-0.5 rounded-xl border border-warning/30">
                  حالت ویرایش
                </span>
              </div>
            </Fieldset.Legend>

            <FieldGroup className="space-y-3.5">
              {/* Representative Name */}
              <TextField name="name" isRequired className="space-y-1 text-start">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <UserIcon size={13} className="text-muted" />
                  <span>نام و نام خانوادگی</span>
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold text-foreground bg-default/15 border border-border rounded-xl focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="مثال: آرش دهقان"
                />
              </TextField>

              {/* Store Name */}
              <TextField name="storeName" isRequired className="space-y-1 text-start">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <StoreIcon size={13} className="text-muted" />
                  <span>نام فروشگاه / شرکت</span>
                  <span className="text-danger">*</span>
                </Label>
                <Input
                  value={formData.storeName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, storeName: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold text-foreground bg-default/15 border border-border rounded-xl focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="مثال: بازرگانی پرشین پارت"
                />
              </TextField>

              {/* Phone Number - Strictly Non-Editable */}
              <div className="space-y-1 text-start">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <PhoneIcon size={13} className="text-muted" />
                    <span>شماره همراه</span>
                  </label>
                  <span className="text-xs font-semibold text-muted bg-default/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <LockIcon size={10} className="text-muted" />
                    <span>ثابت</span>
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-default/15 border border-border rounded-xl text-foreground select-none">
                  <span className="text-xs font-bold tracking-wider" dir="ltr">
                    {toPersianDigits(user.phone)}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-muted bg-surface px-2 py-0.5 rounded-lg border border-border">
                    <LockIcon size={11} className="text-muted" />
                    <span>غیرقابل تغییر</span>
                  </span>
                </div>
              </div>

              {/* Economic / National Code */}
              <TextField name="economicCode" className="space-y-1 text-start">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <ShieldCheckIcon size={14} className="text-muted" />
                  <span>کد اقتصادی / شناسه ملی</span>
                </Label>
                <Input
                  dir="ltr"
                  value={formData.economicCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, economicCode: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold text-foreground bg-default/15 border border-border rounded-xl focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-start"
                  placeholder="مثال: 411589324156"
                />
              </TextField>

              {/* Province & City */}
              <div className="grid grid-cols-2 gap-2.5 text-start">
                <TextField name="province" className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <MapPinIcon size={14} className="text-muted" />
                    <span>استان</span>
                  </Label>
                  <Input
                    value={formData.province}
                    onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-bold text-foreground bg-default/15 border border-border rounded-xl focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="تهران"
                  />
                </TextField>
                <TextField name="city" className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <MapPinIcon size={14} className="text-muted" />
                    <span>شهر</span>
                  </Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-bold text-foreground bg-default/15 border border-border rounded-xl focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="تهران"
                  />
                </TextField>
              </div>

              {/* Delivery Warehouse Address */}
              <TextField name="address" className="space-y-1 text-start">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <MapPinIcon size={14} className="text-muted" />
                  <span>نشانی تحویل</span>
                </Label>
                <TextArea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-medium text-foreground bg-default/15 border border-border rounded-xl focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all leading-relaxed"
                  placeholder="نشانی کامل انبار یا محل تحویل سفارش..."
                />
              </TextField>
            </FieldGroup>

            {/* Form Actions */}
            <Fieldset.Actions className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-bold text-xs  flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
              >
                <CheckIcon size={15} />
                <span>ذخیره تغییرات</span>
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-xl border border-border hover:bg-default/15 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <XIcon size={15} />
                <span>انصراف</span>
              </button>
            </Fieldset.Actions>
          </Fieldset>
        </form>
      ) : (
        /* View Mode Card */
        <div className="bg-surface border border-border rounded-2xl overflow-hidden  divide-y divide-separator">
          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            <UserIcon size={17} className="text-muted mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <span className="text-xs font-semibold text-muted block">نام نماینده / مدیر خرید</span>
              <span className="text-xs sm:text-sm font-bold text-foreground">{user.name}</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            <StoreIcon size={17} className="text-muted mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <span className="text-xs font-semibold text-muted block">عنوان فروشگاه / شرکت حقوقی</span>
              <span className="text-xs sm:text-sm font-bold text-foreground">{user.storeName}</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 flex items-start justify-start gap-3">
            <PhoneIcon size={17} className="text-muted mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <div className="flex items-start justify-start">
                <span className="text-xs font-semibold text-muted block">شماره تلفن همراه</span>
              </div>
              <span className="text-xs sm:text-sm  text-right font-bold text-foreground tracking-wider mt-0.5 block" dir="ltr">
                {toPersianDigits(user.phone)}
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            <ShieldCheckIcon size={17} className="text-muted mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <span className="text-xs font-semibold text-muted block">شناسه ملی / کد اقتصادی</span>
              <span className="text-xs sm:text-sm font-bold text-foreground mt-0.5 block">
                {toPersianDigits(user.economicCode || 'ثبت نشده')}
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 flex items-start gap-3">
            <MapPinIcon size={17} className="text-muted mt-0.5 shrink-0" />
            <div className="flex-1 text-start">
              <span className="text-xs font-semibold text-muted block">نشانی انبار یا محل تحویل</span>
              <span className="text-xs sm:text-sm font-bold text-foreground leading-relaxed block mt-0.5">
                {user.address}
              </span>
              <span className="text-xs text-muted font-medium block mt-1">
                استان {user.province}، شهر {user.city}
              </span>
            </div>
          </div>

          {/* Quick Edit CTA Footer inside View Card */}
          <div className="p-3 bg-default/10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleStartEdit}
              className="py-1.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5  cursor-pointer active:scale-95 transition-all"
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop-enter"
        >
          <HeroUIModal.Container className="pointer-events-none w-full max-w-sm h-auto p-0 flex flex-col items-center">
            <HeroUIModal.Dialog className="pointer-events-auto relative w-full bg-surface rounded-3xl flex flex-col z-10 border border-border overflow-hidden animate-modal-enter text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/20">
                <LogOutIcon size={24} />
              </div>
              <div>
                <HeroUIModal.Heading className="text-base font-bold text-foreground">
                  خروج از حساب کاربری
                </HeroUIModal.Heading>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  آیا از خروج از حساب کاربری همکاران اطمینان دارید؟
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-2.5 rounded-xl border border-border text-foreground text-xs font-bold hover:bg-default/15 cursor-pointer transition-all"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2.5 rounded-xl bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-bold  cursor-pointer transition-all"
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

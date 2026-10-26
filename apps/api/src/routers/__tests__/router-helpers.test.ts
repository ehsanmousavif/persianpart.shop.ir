import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateCartonMetrics } from '../catalog.helpers'
import {
  formatCustomerProfile,
  applyProductPricing,
  toPersianDigits,
} from '../router.helpers'
import { normalizeDigits } from '../../lib/otp'

test('normalizeDigits converts Persian and Arabic digits to English', () => {
  assert.strictEqual(normalizeDigits('۰۹۱۲۳۴۵۶۷۸۹'), '09123456789')
  assert.strictEqual(normalizeDigits('٠٩١٢٣٤٥٦٧٨٩'), '09123456789')
  assert.strictEqual(normalizeDigits(' ۰۹۱۲ ۳۴۵ ۶۷۸۹ '), '09123456789')
})

test('toPersianDigits converts English digits to Persian characters', () => {
  assert.strictEqual(toPersianDigits('09123456789'), '۰۹۱۲۳۴۵۶۷۸۹')
})

test('formatCustomerProfile preserves actual values and does not inject fake Tehran defaults', () => {
  const rawUser = {
    id: 101,
    fullName: 'علی محمدی',
    phone: '09123456789',
    companyName: '',
    province: '',
    city: '',
    address: 'خیابان لاله زار',
  }

  const profile = formatCustomerProfile(rawUser)
  assert.ok(profile)
  assert.strictEqual(profile.id, '101')
  assert.strictEqual(profile.contactName, 'علی محمدی')
  assert.strictEqual(profile.mobile, '09123456789')
  // Invariant: Must not inject fake 'تهران' or 'فروشگاه قطعات'
  assert.strictEqual(profile.storeName, '')
  assert.strictEqual(profile.province, '')
  assert.strictEqual(profile.city, '')
  assert.strictEqual(profile.address, 'خیابان لاله زار')
})

test('applyProductPricing applies customer tier markup percentage accurately', () => {
  const product = {
    id: 1,
    name: 'سرامیک پرسلان ۶۰*۱۲۰',
    basePricePerSqm: 400000,
  }

  // 15% markup
  const result = applyProductPricing(product, 15)
  assert.strictEqual(result.finalCustomerPricePerSqm, 460000)
  assert.strictEqual(result.appliedMarkupPercent, 15)

  // 0% markup
  const zeroResult = applyProductPricing(product, 0)
  assert.strictEqual(zeroResult.finalCustomerPricePerSqm, 400000)
})

test('calculateCartonMetrics throws error when sqmPerCarton is missing or invalid', async () => {
  await assert.rejects(
    async () => {
      await calculateCartonMetrics({ requestedArea: 10 })
    },
    (err: any) => {
      assert.strictEqual(err.code, 'BAD_REQUEST')
      return true
    }
  )

  await assert.rejects(
    async () => {
      await calculateCartonMetrics({ sqmPerCarton: -1, requestedArea: 10 })
    },
    (err: any) => {
      assert.strictEqual(err.code, 'BAD_REQUEST')
      return true
    }
  )
})

test('calculateCartonMetrics calculates ceiling carton count and total price accurately', async () => {
  // 10 sqm requested, 1.44 sqm/carton -> 7 cartons -> 10.08 sqm deliverable
  // Price: 500,000 / sqm -> 10.08 * 500,000 = 5,040,000
  const result = await calculateCartonMetrics({
    sqmPerCarton: 1.44,
    pricePerSqm: 500000,
    requestedArea: 10,
  })

  assert.strictEqual(result.cartonCount, 7)
  assert.strictEqual(result.deliverableArea, 10.08)
  assert.strictEqual(result.totalPrice, 5040000)
})

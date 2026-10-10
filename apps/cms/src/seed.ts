import 'dotenv/config'
import { getPayloadClient } from './payload.js'

interface CategorySeed {
  name: string
  slug: string
  ordering: number
}

interface BrandSeed {
  name: string
  slug: string
}

interface TagSeed {
  name: string
  slug: string
}

interface ProductSeed {
  sku: string
  name: string
  slug: string
  categorySlug: string
  brandSlug: string
  color: string
  finish: 'matte' | 'glossy' | 'polished' | 'semi_polished' | 'sugar' | 'rustic'
  grade: 'grade_1' | 'grade_2' | 'grade_3' | 'grade_4'
  tagSlugs: string[]
  width: number
  height: number
  piecesPerCarton: number
  sqmPerCarton: number
  basePricePerSqm: number
  stockCartons: number
}

const CATEGORIES: CategorySeed[] = [
  { name: 'پرسلان کف', slug: 'porcelain-floor', ordering: 1 },
  { name: 'اسلب پرسلان', slug: 'porcelain-slab', ordering: 2 },
  { name: 'دیوار و بدنه لوکس', slug: 'luxury-wall', ordering: 3 },
  { name: 'سرامیک نما و محوطه', slug: 'facade-outdoor', ordering: 4 },
  { name: 'کاشی بین کابینتی و دکوراتیو', slug: 'decorative-kitchen', ordering: 5 },
  { name: 'سرامیک ضد اسید و صنعتی', slug: 'industrial-anti-acid', ordering: 6 },
  { name: 'سرویس و حمام ضد آب', slug: 'bathroom-waterproof', ordering: 7 },
]

const BRANDS: BrandSeed[] = [
  { name: 'کاشی و سرامیک پرسپولیس', slug: 'persepolis-tile' },
  { name: 'کاشی مرجان', slug: 'marjan-tile' },
  { name: 'صنایع کاشی تبریز', slug: 'tabriz-tile' },
  { name: 'کاشی و سرامیک الوند', slug: 'alvand-tile' },
  { name: 'شرکت تکسرام', slug: 'teceram' },
  { name: 'کاشی و سرامیک سینا', slug: 'sina-tile' },
  { name: 'راک سرامیک ایران', slug: 'rak-ceramics' },
  { name: 'کاشی پارس', slug: 'pars-tile' },
]

const TAGS: TagSeed[] = [
  { name: 'پرفروش و محبوب', slug: 'bestseller' },
  { name: 'رکتیفای (بدون بند)', slug: 'rectified' },
  { name: 'نانو سوپر پولیش', slug: 'nano-polished' },
  { name: 'مقاوم در برابر سایش (PEI 4+)', slug: 'abrasion-resistant' },
  { name: 'مقاوم در برابر یخ‌زدگی و رطوبت', slug: 'frost-resistant' },
  { name: 'کالیبره دقیق', slug: 'calibrated' },
  { name: 'پرسلان فول بادی', slug: 'full-body-porcelain' },
  { name: 'لعاب مات ابریشمی', slug: 'silk-matte' },
  { name: 'مناسب گرمایش از کف', slug: 'underfloor-heating' },
  { name: 'ضد لغزش (R11)', slug: 'anti-slip-r11' },
]

const PRODUCTS: ProductSeed[] = [
  {
    sku: 'PP-CAL-60120-P',
    name: 'کاشی پرسلان کلاکاتا گلد پالرمو',
    slug: 'calacatta-gold-palermo-60x120',
    categorySlug: 'porcelain-floor',
    brandSlug: 'tabriz-tile',
    color: 'سفید با رگه طلایی',
    finish: 'polished',
    grade: 'grade_1',
    tagSlugs: ['bestseller', 'nano-polished', 'rectified', 'underfloor-heating'],
    width: 60,
    height: 120,
    piecesPerCarton: 2,
    sqmPerCarton: 1.44,
    basePricePerSqm: 820000,
    stockCartons: 450,
  },
  {
    sku: 'PP-MRQ-120240-P',
    name: 'اسلب پرسلان مارکوئینا بلک لوکس',
    slug: 'marquina-black-slab-120x240',
    categorySlug: 'porcelain-slab',
    brandSlug: 'rak-ceramics',
    color: 'مشکی رگه‌دار سفید',
    finish: 'polished',
    grade: 'grade_1',
    tagSlugs: ['nano-polished', 'full-body-porcelain', 'rectified'],
    width: 120,
    height: 240,
    piecesPerCarton: 1,
    sqmPerCarton: 2.88,
    basePricePerSqm: 1950000,
    stockCartons: 120,
  },
  {
    sku: 'PP-CEM-100100-M',
    name: 'سرامیک پرسلان بتن اکسپوز شیلی گری',
    slug: 'cement-chile-grey-100x100',
    categorySlug: 'porcelain-floor',
    brandSlug: 'teceram',
    color: 'طوسی بتنی روشن',
    finish: 'matte',
    grade: 'grade_1',
    tagSlugs: ['rectified', 'abrasion-resistant', 'underfloor-heating'],
    width: 100,
    height: 100,
    piecesPerCarton: 2,
    sqmPerCarton: 2.0,
    basePricePerSqm: 760000,
    stockCartons: 380,
  },
  {
    sku: 'PP-WOD-20120-R',
    name: 'سرامیک طرح چوب و پارکت رویال هانی',
    slug: 'royal-honey-wood-parquet-20x120',
    categorySlug: 'porcelain-floor',
    brandSlug: 'persepolis-tile',
    color: 'قهوه‌ای روشن عسلی',
    finish: 'rustic',
    grade: 'grade_1',
    tagSlugs: ['bestseller', 'anti-slip-r11', 'rectified'],
    width: 20,
    height: 120,
    piecesPerCarton: 5,
    sqmPerCarton: 1.2,
    basePricePerSqm: 610000,
    stockCartons: 520,
  },
  {
    sku: 'PP-ONX-80160-P',
    name: 'اسلب پرسلان اونیکس وایت کریستال',
    slug: 'onyx-white-crystal-slab-80x160',
    categorySlug: 'porcelain-slab',
    brandSlug: 'tabriz-tile',
    color: 'سفید شفاف ابری',
    finish: 'polished',
    grade: 'grade_1',
    tagSlugs: ['nano-polished', 'rectified'],
    width: 80,
    height: 160,
    piecesPerCarton: 2,
    sqmPerCarton: 2.56,
    basePricePerSqm: 1480000,
    stockCartons: 200,
  },
  {
    sku: 'PP-PAN-3090-G',
    name: 'کاشی دیوار لوکس پاندا وایت',
    slug: 'panda-white-luxury-wall-30x90',
    categorySlug: 'luxury-wall',
    brandSlug: 'alvand-tile',
    color: 'سفید با رگه مشکی پهن',
    finish: 'glossy',
    grade: 'grade_1',
    tagSlugs: ['rectified', 'bestseller'],
    width: 30,
    height: 90,
    piecesPerCarton: 4,
    sqmPerCarton: 1.08,
    basePricePerSqm: 540000,
    stockCartons: 600,
  },
  {
    sku: 'PP-PLM-60120-M',
    name: 'سرامیک پرسلان پالرمو اسموکی گری',
    slug: 'palermo-smokey-grey-60x120',
    categorySlug: 'porcelain-floor',
    brandSlug: 'marjan-tile',
    color: 'دودی طوسی تیره',
    finish: 'matte',
    grade: 'grade_2',
    tagSlugs: ['calibrated', 'abrasion-resistant'],
    width: 60,
    height: 120,
    piecesPerCarton: 2,
    sqmPerCarton: 1.44,
    basePricePerSqm: 590000,
    stockCartons: 400,
  },
  {
    sku: 'PP-TRV-40120-R',
    name: 'سرامیک نما و محوطه تراورتن کرم سیلور',
    slug: 'travertine-cream-silver-facade-40x120',
    categorySlug: 'facade-outdoor',
    brandSlug: 'persepolis-tile',
    color: 'کرم بژ طرح سنگ',
    finish: 'rustic',
    grade: 'grade_1',
    tagSlugs: ['frost-resistant', 'anti-slip-r11'],
    width: 40,
    height: 120,
    piecesPerCarton: 3,
    sqmPerCarton: 1.44,
    basePricePerSqm: 520000,
    stockCartons: 700,
  },
  {
    sku: 'PP-HEX-3060-G',
    name: 'کاشی بین کابینتی هگزاگون زولیا گلد',
    slug: 'zolia-gold-hexagon-kitchen-30x60',
    categorySlug: 'decorative-kitchen',
    brandSlug: 'alvand-tile',
    color: 'طلایی متالیک و مشکی',
    finish: 'sugar',
    grade: 'grade_1',
    tagSlugs: ['bestseller', 'rectified'],
    width: 30,
    height: 60,
    piecesPerCarton: 8,
    sqmPerCarton: 1.44,
    basePricePerSqm: 680000,
    stockCartons: 250,
  },
  {
    sku: 'PP-ACD-3030-M',
    name: 'سرامیک ضد اسید صنعتی پرسلان راک',
    slug: 'industrial-anti-acid-porcelain-30x30',
    categorySlug: 'industrial-anti-acid',
    brandSlug: 'marjan-tile',
    color: 'زرد گرانیتی دانه دار',
    finish: 'matte',
    grade: 'grade_1',
    tagSlugs: ['full-body-porcelain', 'abrasion-resistant', 'anti-slip-r11'],
    width: 30,
    height: 30,
    piecesPerCarton: 12,
    sqmPerCarton: 1.08,
    basePricePerSqm: 710000,
    stockCartons: 850,
  },
  {
    sku: 'PP-EXT-8080-P',
    name: 'سرامیک پرسلان کلکته اکسترا وایت',
    slug: 'extra-white-calacatta-80x80',
    categorySlug: 'porcelain-floor',
    brandSlug: 'teceram',
    color: 'سوپر وایت شفاف',
    finish: 'polished',
    grade: 'grade_1',
    tagSlugs: ['nano-polished', 'bestseller', 'underfloor-heating'],
    width: 80,
    height: 80,
    piecesPerCarton: 3,
    sqmPerCarton: 1.92,
    basePricePerSqm: 690000,
    stockCartons: 420,
  },
  {
    sku: 'PP-STT-3090-P',
    name: 'کاشی دیوار حمام و سرویس استاتوارو لوکس',
    slug: 'statuario-luxury-bath-wall-30x90',
    categorySlug: 'bathroom-waterproof',
    brandSlug: 'tabriz-tile',
    color: 'سفید رگه‌دار فیلی',
    finish: 'semi_polished',
    grade: 'grade_1',
    tagSlugs: ['rectified', 'silk-matte'],
    width: 30,
    height: 90,
    piecesPerCarton: 4,
    sqmPerCarton: 1.08,
    basePricePerSqm: 570000,
    stockCartons: 360,
  },
  {
    sku: 'PP-WLN-20120-M',
    name: 'سرامیک پرسلان طرح چوب گردو ناتورال',
    slug: 'walnut-natural-wood-parquet-20x120',
    categorySlug: 'porcelain-floor',
    brandSlug: 'sina-tile',
    color: 'قهوه‌ای تیره گردویی',
    finish: 'matte',
    grade: 'grade_1',
    tagSlugs: ['bestseller', 'underfloor-heating', 'rectified'],
    width: 20,
    height: 120,
    piecesPerCarton: 5,
    sqmPerCarton: 1.2,
    basePricePerSqm: 620000,
    stockCartons: 480,
  },
  {
    sku: 'PP-PTR-120240-M',
    name: 'اسلب پرسلان پیترا گری اصفهان مات',
    slug: 'pietra-grey-slab-isfehan-120x240',
    categorySlug: 'porcelain-slab',
    brandSlug: 'rak-ceramics',
    color: 'طوسی گرافیتی با خطوط سفید',
    finish: 'matte',
    grade: 'grade_1',
    tagSlugs: ['full-body-porcelain', 'rectified', 'silk-matte'],
    width: 120,
    height: 240,
    piecesPerCarton: 1,
    sqmPerCarton: 2.88,
    basePricePerSqm: 1890000,
    stockCartons: 95,
  },
  {
    sku: 'PP-ZEU-60120-M',
    name: 'سرامیک کف پرسلان زئوس آنتراسیت',
    slug: 'zeus-anthracite-porcelain-60x120',
    categorySlug: 'porcelain-floor',
    brandSlug: 'marjan-tile',
    color: 'دودی ذغالی متالیک',
    finish: 'matte',
    grade: 'grade_1',
    tagSlugs: ['abrasion-resistant', 'calibrated', 'underfloor-heating'],
    width: 60,
    height: 120,
    piecesPerCarton: 2,
    sqmPerCarton: 1.44,
    basePricePerSqm: 640000,
    stockCartons: 310,
  },
  {
    sku: 'PP-AND-3060-R',
    name: 'سرامیک نما و بالکن آندلس متالیک',
    slug: 'andalus-metallic-facade-balcony-30x60',
    categorySlug: 'facade-outdoor',
    brandSlug: 'persepolis-tile',
    color: 'آجری متالیک زنگار',
    finish: 'rustic',
    grade: 'grade_2',
    tagSlugs: ['frost-resistant', 'anti-slip-r11'],
    width: 30,
    height: 60,
    piecesPerCarton: 8,
    sqmPerCarton: 1.44,
    basePricePerSqm: 440000,
    stockCartons: 550,
  },
  {
    sku: 'PP-DIA-3060-G',
    name: 'کاشی بین کابینتی آینه‌ای دیاموند کروم',
    slug: 'diamond-chrome-mirror-kitchen-30x60',
    categorySlug: 'decorative-kitchen',
    brandSlug: 'pars-tile',
    color: 'نقره‌ای کروم براق',
    finish: 'glossy',
    grade: 'grade_1',
    tagSlugs: ['rectified', 'bestseller'],
    width: 30,
    height: 60,
    piecesPerCarton: 8,
    sqmPerCarton: 1.44,
    basePricePerSqm: 720000,
    stockCartons: 180,
  },
  {
    sku: 'PP-QRT-8080-M',
    name: 'سرامیک پرسلان کف کوارتزایت لایت بژ',
    slug: 'quartzite-light-beige-floor-80x80',
    categorySlug: 'porcelain-floor',
    brandSlug: 'alvand-tile',
    color: 'کرم بژ ماسه‌ای',
    finish: 'matte',
    grade: 'grade_1',
    tagSlugs: ['calibrated', 'abrasion-resistant', 'bestseller'],
    width: 80,
    height: 80,
    piecesPerCarton: 3,
    sqmPerCarton: 1.92,
    basePricePerSqm: 580000,
    stockCartons: 620,
  },
  {
    sku: 'PP-ARM-40120-S',
    name: 'کاشی بدنه سالن و لابی آرمانی برنز',
    slug: 'armani-bronze-luxury-wall-40x120',
    categorySlug: 'luxury-wall',
    brandSlug: 'tabriz-tile',
    color: 'برنز قهوه‌ای متالیک',
    finish: 'sugar',
    grade: 'grade_1',
    tagSlugs: ['rectified', 'nano-polished'],
    width: 40,
    height: 120,
    piecesPerCarton: 3,
    sqmPerCarton: 1.44,
    basePricePerSqm: 890000,
    stockCartons: 240,
  },
  {
    sku: 'PP-NER-6060-P',
    name: 'سرامیک کف پرسلان نرو مارکینا براق',
    slug: 'nero-marquina-polished-floor-60x60',
    categorySlug: 'porcelain-floor',
    brandSlug: 'teceram',
    color: 'مشکی براق با خطوط عنکبوتی',
    finish: 'polished',
    grade: 'grade_1',
    tagSlugs: ['nano-polished', 'bestseller'],
    width: 60,
    height: 60,
    piecesPerCarton: 4,
    sqmPerCarton: 1.44,
    basePricePerSqm: 510000,
    stockCartons: 430,
  },
  {
    sku: 'PP-HRD-6060-R',
    name: 'سرامیک پارکینگ و رمپ پرسلان هارد راک',
    slug: 'hard-rock-parking-ramp-60x60',
    categorySlug: 'facade-outdoor',
    brandSlug: 'marjan-tile',
    color: 'طوسی گرانیتی دانه‌درشت',
    finish: 'rustic',
    grade: 'grade_1',
    tagSlugs: ['abrasion-resistant', 'anti-slip-r11', 'frost-resistant'],
    width: 60,
    height: 60,
    piecesPerCarton: 4,
    sqmPerCarton: 1.44,
    basePricePerSqm: 495000,
    stockCartons: 750,
  },
  {
    sku: 'PP-TTN-80160-M',
    name: 'اسلب پرسلان لاپاتیز تیتانیوم سیلور',
    slug: 'titanium-silver-slab-80x160',
    categorySlug: 'porcelain-slab',
    brandSlug: 'rak-ceramics',
    color: 'نقره‌ای متالیک مات',
    finish: 'semi_polished',
    grade: 'grade_1',
    tagSlugs: ['rectified', 'silk-matte'],
    width: 80,
    height: 160,
    piecesPerCarton: 2,
    sqmPerCarton: 2.56,
    basePricePerSqm: 1350000,
    stockCartons: 170,
  },
  {
    sku: 'PP-CWL-3090-G',
    name: 'کاشی دیوار سرویس بهداشتی کلکته گلد لوکس',
    slug: 'calacatta-gold-luxury-bath-wall-30x90',
    categorySlug: 'bathroom-waterproof',
    brandSlug: 'pars-tile',
    color: 'سفید زرین',
    finish: 'glossy',
    grade: 'grade_1',
    tagSlugs: ['rectified', 'bestseller'],
    width: 30,
    height: 90,
    piecesPerCarton: 4,
    sqmPerCarton: 1.08,
    basePricePerSqm: 530000,
    stockCartons: 390,
  },
  {
    sku: 'PP-EMP-100100-P',
    name: 'سرامیک پرسلان کف بوک‌مچ امپرادور دارک',
    slug: 'emperador-dark-bookmatch-floor-100x100',
    categorySlug: 'porcelain-floor',
    brandSlug: 'tabriz-tile',
    color: 'قهوه‌ای شکلاتی با رگه‌های طلایی',
    finish: 'polished',
    grade: 'grade_1',
    tagSlugs: ['nano-polished', 'bestseller', 'underfloor-heating'],
    width: 100,
    height: 100,
    piecesPerCarton: 2,
    sqmPerCarton: 2.0,
    basePricePerSqm: 980000,
    stockCartons: 220,
  },
  {
    sku: 'PP-BRK-3060-R',
    name: 'سرامیک پرسلان طرح آجر دکوراتیو هلندی',
    slug: 'dutch-brick-decorative-porcelain-30x60',
    categorySlug: 'decorative-kitchen',
    brandSlug: 'sina-tile',
    color: 'خاکی حنایی رستیک',
    finish: 'rustic',
    grade: 'grade_1',
    tagSlugs: ['rectified', 'anti-slip-r11'],
    width: 30,
    height: 60,
    piecesPerCarton: 8,
    sqmPerCarton: 1.44,
    basePricePerSqm: 460000,
    stockCartons: 310,
  },
  {
    sku: 'PP-TRZ-60120-M',
    name: 'سرامیک پرسلان کف ترازو گرانیتی میلان',
    slug: 'milano-terrazzo-grey-porcelain-60x120',
    categorySlug: 'porcelain-floor',
    brandSlug: 'teceram',
    color: 'طوسی بتنی با سنگریزه‌های چندرنگ',
    finish: 'matte',
    grade: 'grade_1',
    tagSlugs: ['full-body-porcelain', 'abrasion-resistant', 'calibrated'],
    width: 60,
    height: 120,
    piecesPerCarton: 2,
    sqmPerCarton: 1.44,
    basePricePerSqm: 740000,
    stockCartons: 360,
  },
]

export async function runSeed() {
  console.log('🚀 Starting PersianPart 2.0 Database Seeding...')
  const payload = await getPayloadClient()

  // 1. Seed Categories
  console.log('📦 Seeding Categories...')
  const categoryMap = new Map<string, number>()
  for (const cat of CATEGORIES) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    })

    let id: number
    if (existing.docs.length > 0) {
      id = existing.docs[0].id
      await payload.update({
        collection: 'categories',
        id,
        data: { name: cat.name, ordering: cat.ordering, isActive: true },
      })
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: { name: cat.name, slug: cat.slug, ordering: cat.ordering, isActive: true },
      })
      id = created.id
    }
    categoryMap.set(cat.slug, id)
  }
  console.log(`✅ ${categoryMap.size} Categories synchronized.`)

  // 2. Seed Brands
  console.log('🏢 Seeding Brands...')
  const brandMap = new Map<string, number>()
  for (const br of BRANDS) {
    const existing = await payload.find({
      collection: 'brands',
      where: { slug: { equals: br.slug } },
      limit: 1,
    })

    let id: number
    if (existing.docs.length > 0) {
      id = existing.docs[0].id
      await payload.update({
        collection: 'brands',
        id,
        data: { name: br.name, isActive: true },
      })
    } else {
      const created = await payload.create({
        collection: 'brands',
        data: { name: br.name, slug: br.slug, isActive: true },
      })
      id = created.id
    }
    brandMap.set(br.slug, id)
  }
  console.log(`✅ ${brandMap.size} Brands synchronized.`)

  // 3. Seed Tags
  console.log('🏷️ Seeding Tags...')
  const tagMap = new Map<string, number>()
  for (const t of TAGS) {
    const existing = await payload.find({
      collection: 'tags',
      where: { slug: { equals: t.slug } },
      limit: 1,
    })

    let id: number
    if (existing.docs.length > 0) {
      id = existing.docs[0].id
      await payload.update({
        collection: 'tags',
        id,
        data: { name: t.name, isActive: true },
      })
    } else {
      const created = await payload.create({
        collection: 'tags',
        data: { name: t.name, slug: t.slug, isActive: true },
      })
      id = created.id
    }
    tagMap.set(t.slug, id)
  }
  console.log(`✅ ${tagMap.size} Tags synchronized.`)

  // 4. Retrieve available Media IDs
  const mediaList = await payload.find({
    collection: 'media',
    limit: 10,
  })
  const defaultMediaId = mediaList.docs.length > 0 ? mediaList.docs[0].id : null
  const secondaryMediaId = mediaList.docs.length > 1 ? mediaList.docs[1].id : defaultMediaId

  // 5. Seed Products
  console.log(`💎 Seeding ${PRODUCTS.length} realistic Products...`)
  let createdCount = 0
  let updatedCount = 0

  for (const prod of PRODUCTS) {
    const categoryId = categoryMap.get(prod.categorySlug) || null
    const brandId = brandMap.get(prod.brandSlug) || null
    const tagIds = prod.tagSlugs.map((slug) => tagMap.get(slug)).filter((id): id is number => typeof id === 'number')

    const inventorySqm = Math.round(prod.stockCartons * prod.sqmPerCarton * 100) / 100

    const productData: any = {
      sku: prod.sku,
      name: prod.name,
      slug: prod.slug,
      category: categoryId,
      brand: brandId,
      color: prod.color,
      finish: prod.finish,
      grade: prod.grade,
      tags: tagIds,
      width: prod.width,
      height: prod.height,
      piecesPerCarton: prod.piecesPerCarton,
      sqmPerCarton: prod.sqmPerCarton,
      basePricePerSqm: prod.basePricePerSqm,
      stockCartons: prod.stockCartons,
      inventorySqm,
      isActive: true,
    }

    if (defaultMediaId) {
      productData.cover = defaultMediaId
      if (secondaryMediaId) {
        productData.gallery = [{ image: secondaryMediaId }]
      }
    }

    const existing = await payload.find({
      collection: 'products',
      where: {
        or: [{ sku: { equals: prod.sku } }, { slug: { equals: prod.slug } }],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'products',
        id: existing.docs[0].id,
        data: productData,
      })
      updatedCount++
    } else {
      await payload.create({
        collection: 'products',
        data: productData,
      })
      createdCount++
    }
  }

  // 6. Deactivate legacy dummy test products
  try {
    const all = await payload.find({ collection: 'products', limit: 100 })
    const dummies = all.docs.filter((d: any) => d.name?.includes('شومبول') || d.sku?.includes('شومبول'))
    for (const dummy of dummies) {
      await payload.update({
        collection: 'products',
        id: dummy.id,
        data: { isActive: false },
      })
      console.log(`🔒 Deactivated legacy test product #${dummy.id} (${dummy.name})`)
    }
  } catch (err) {
    // ignore
  }

  console.log(`🎉 Seeding complete! (${createdCount} created, ${updatedCount} updated, total: ${PRODUCTS.length} products)`)
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv.includes('--run')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed with error:', err)
      process.exit(1)
    })
}

import { implement } from '@orpc/server'
import { partsContract, type Part } from '@persianpart/contract'
import type { Context } from '../context'

const implementer = implement(partsContract).$context<Context>()

// Initial mock dataset for Iranian automotive market
const MOCK_PARTS: Part[] = [
  {
    id: 'part-1',
    partNumber: 'IK-206-BRAKE-01',
    nameFa: 'لنت ترمز جلو پژو ۲۰۶ تیپ ۲ و ۵',
    nameEn: 'Front Brake Pads Peugeot 206',
    category: 'سیستم ترمز',
    vehicleBrand: 'ایران خودرو',
    vehicleModels: ['پژو ۲۰۶', 'پژو ۲۰۷', 'رانا'],
    priceTomans: 850000,
    stock: 24,
    isOriginal: true,
  },
  {
    id: 'part-2',
    partNumber: 'SP-PRD-CLUTCH-02',
    nameFa: 'کیت کلاچ پراید والئو اصلی',
    nameEn: 'Clutch Kit Pride Valeo',
    category: 'گیربکس و انتقال قدرت',
    vehicleBrand: 'سایپا',
    vehicleModels: ['پراید ۱۳۱', 'پراید ۱۱۱', 'تیبا'],
    priceTomans: 2450000,
    stock: 12,
    isOriginal: true,
  },
  {
    id: 'part-3',
    partNumber: 'IK-SMD-BELT-03',
    nameFa: 'تسمه تایم سمند و پژو پارس موتور XU7',
    nameEn: 'Timing Belt Samand / Pars XU7',
    category: 'موتور',
    vehicleBrand: 'ایران خودرو',
    vehicleModels: ['سمند LX', 'پژو پارس', 'پژو ۴۰۵'],
    priceTomans: 620000,
    stock: 35,
    isOriginal: true,
  },
  {
    id: 'part-4',
    partNumber: 'IK-TRA-FILTER-04',
    nameFa: 'فیلتر روغن تارا و دنا پلاس توربو EF7',
    nameEn: 'Oil Filter Tara / Dena Plus EF7',
    category: 'فیلترها و روانکارها',
    vehicleBrand: 'ایران خودرو',
    vehicleModels: ['تارا', 'دنا پلاس', 'سورن پلاس'],
    priceTomans: 190000,
    stock: 80,
    isOriginal: false,
  },
]

export const partsRouter = implementer.router({
  list: implementer.list.handler(async ({ input }) => {
    let items = MOCK_PARTS

    if (input.brand) {
      items = items.filter((p) =>
        p.vehicleBrand.toLowerCase().includes(input.brand!.toLowerCase())
      )
    }

    if (input.category) {
      items = items.filter((p) =>
        p.category.toLowerCase().includes(input.category!.toLowerCase())
      )
    }

    const total = items.length
    const paginated = items.slice(input.offset, input.offset + input.limit)

    return {
      items: paginated,
      total,
      limit: input.limit,
      offset: input.offset,
    }
  }),

  getById: implementer.getById.handler(async ({ input, errors }) => {
    const found = MOCK_PARTS.find((p) => p.id === input.id)
    if (!found) {
      throw errors.NOT_FOUND()
    }
    return found
  }),
})

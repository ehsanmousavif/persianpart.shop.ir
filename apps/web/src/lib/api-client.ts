import { createApiClient } from '@persianpart/api'

export const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5149',
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('persianpart_token')
    }
    return null
  },
})

export type { AppRouter } from '@persianpart/api'
export { appContract } from '@persianpart/contract'
export type {
  AppContract,
  CustomerProfile,
  CustomerStaffDetail,
  StaffProfile,
  CustomerType,
  Product,
  CatalogProduct,
  AvailabilityBadge,
  ValidatedCartItem,
  ValidateCartOutput,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  OrderTimelineEvent,
  PrepareReorderOutput,
  ImportPreviewReport,
  ImportRunSummary,
  AuditEvent,
  GlobalConfig,
} from '@persianpart/contract'

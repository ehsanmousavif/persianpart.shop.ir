import { createApiClient } from '@persianpart/api/client'
import type { AppRouter, ApiClient } from '@persianpart/api'

// In development & production, fallback to current origin or CMS port 5148
const defaultBaseUrl =
  typeof window !== 'undefined'
    ? (import.meta.env.PROD ? window.location.origin : 'http://localhost:5148')
    : 'http://localhost:5148'

export const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('persianpart_token')
    }
    return null
  },
})

export type { AppRouter, ApiClient }
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

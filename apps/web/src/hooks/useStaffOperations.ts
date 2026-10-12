import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  api,
  type Order,
  type OrderStatus,
  type ImportPreviewReport,
  type ImportRunSummary,
  type AuditEvent,
} from '../lib/api-client'
import { queryKeys, mutationKeys } from '../lib/query-keys'

export function useStaffOrders(filters?: {
  status?: OrderStatus
  customerId?: string
  search?: string
  page?: number
  limit?: number
}) {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: async () => {
      return await api.order.staffList(filters || {})
    },
    staleTime: 30 * 1000,
  })

  const updateStatusMutation = useMutation({
    mutationKey: mutationKeys.orders.staffUpdateStatus,
    mutationFn: async ({
      orderId,
      newStatus,
      note,
    }: {
      orderId: string
      newStatus: OrderStatus
      note?: string
    }) => {
      return await api.order.staffUpdateStatus({ id: orderId, newStatus, note })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })

  const cancelOrderMutation = useMutation({
    mutationKey: mutationKeys.orders.staffCancel,
    mutationFn: async ({
      orderId,
      reason,
      note,
    }: {
      orderId: string
      reason: string
      note?: string
    }) => {
      return await api.order.staffCancel({
        id: orderId,
        cancellationReason: reason,
        cancellationNote: note,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })

  return {
    orders: (data?.items || []) as Order[],
    total: data?.total || 0,
    isLoading,
    refetch,
    updateStatus: (orderId: string, newStatus: OrderStatus, note?: string) =>
      updateStatusMutation.mutateAsync({ orderId, newStatus, note }),
    cancelOrder: (orderId: string, reason: string, note?: string) =>
      cancelOrderMutation.mutateAsync({ orderId, reason, note }),
  }
}

export function useCsvPipeline() {
  const queryClient = useQueryClient()

  const { data: runsData, refetch: refetchHistory } = useQuery({
    queryKey: queryKeys.system.csvRuns(),
    queryFn: async () => {
      try {
        const res = await api.system.csvImport.listRuns({})
        return res.items || []
      } catch {
        return []
      }
    },
    staleTime: 60 * 1000,
  })

  const previewMutation = useMutation({
    mutationKey: mutationKeys.system.csvPreview,
    mutationFn: async ({
      filename,
      csvContent,
    }: {
      filename: string
      csvContent: string
    }) => {
      return await api.system.csvImport.preview({ filename, csvContent })
    },
  })

  const applyMutation = useMutation({
    mutationKey: mutationKeys.system.csvApply,
    mutationFn: async (importRunId: string) => {
      return await api.system.csvImport.apply({ importRunId })
    },
    onSuccess: () => {
      previewMutation.reset()
      queryClient.invalidateQueries({ queryKey: queryKeys.system.csvRuns() })
    },
  })

  return {
    preview: (previewMutation.data || null) as ImportPreviewReport | null,
    history: (runsData || []) as ImportRunSummary[],
    isLoading: previewMutation.isPending || applyMutation.isPending,
    error: previewMutation.error
      ? (previewMutation.error as Error).message
      : applyMutation.error
      ? (applyMutation.error as Error).message
      : null,
    uploadAndPreview: (filename: string, csvContent: string) =>
      previewMutation.mutateAsync({ filename, csvContent }),
    applyPreview: (importRunId: string) => applyMutation.mutateAsync(importRunId),
    clearPreview: () => previewMutation.reset(),
    refetchHistory,
  }
}

export function useAuditEvents(filters?: {
  action?: any
  entityType?: string
  page?: number
  limit?: number
}) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.system.audit(filters),
    queryFn: async () => {
      try {
        return await api.system.audit.list(filters || {})
      } catch {
        return { items: [], total: 0 }
      }
    },
    staleTime: 30 * 1000,
  })

  return {
    events: (data?.items || []) as AuditEvent[],
    total: data?.total || 0,
    isLoading,
    refetch,
  }
}

import { ApiClient } from "./apiClient"

export interface ApiAuditLog {
  id: string
  utilisateur: string
  role: string
  action: string
  module: string
  cible?: string
  details?: string
  ip_address?: string
  timestamp: string
}

export interface AuditLogsPageResult {
  data: ApiAuditLog[]
  total: number
}

export const auditService = {
  async getAuditLogs(params?: { module?: string; action?: string; skip?: number; limit?: number }): Promise<ApiAuditLog[]> {
    try {
      return await ApiClient.get<ApiAuditLog[]>("/audit", params)
    } catch (e) {
      console.warn("API audit indisponible, fallback local:", e)
      return []
    }
  },

  async getAuditLogsPage(
    filters: { module?: string; action?: string; q?: string; order?: "asc" | "desc" } | undefined,
    page: { skip: number; limit: number }
  ): Promise<AuditLogsPageResult> {
    try {
      const { data, total } = await ApiClient.getPaginated<ApiAuditLog>("/audit", { ...filters, ...page })
      return { data, total }
    } catch (e) {
      console.warn("API audit indisponible, fallback local:", e)
      return { data: [], total: 0 }
    }
  },
}

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

export const auditService = {
  async getAuditLogs(params?: { module?: string; action?: string; limit?: number }): Promise<ApiAuditLog[]> {
    try {
      return await ApiClient.get<ApiAuditLog[]>("/audit", params)
    } catch (e) {
      console.warn("API audit indisponible, fallback local:", e)
      return []
    }
  },
}

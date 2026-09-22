import { ApiClient } from "./apiClient"
import type { FinancialGraph } from "@/models/graph"

export const graphService = {
  async getClientGraph(clientId: string): Promise<FinancialGraph> {
    try {
      return await ApiClient.get<FinancialGraph>(`/graph/client/${clientId}`)
    } catch (e) {
      console.error(`Erreur API graphe pour client ${clientId}:`, e)
      throw e
    }
  },

  async getGlobalGraph(): Promise<FinancialGraph> {
    try {
      return await ApiClient.get<FinancialGraph>("/graph/global")
    } catch (e) {
      console.error("Erreur API graphe global:", e)
      throw e
    }
  },
}


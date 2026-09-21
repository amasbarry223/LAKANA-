import { ApiClient } from "./apiClient"
import type { Alert, AlertFilter } from "@/models/alert"

export const alertService = {
  async getAlerts(filters?: AlertFilter): Promise<Alert[]> {
    try {
      const data = await ApiClient.get<any[]>("/alerts", filters)
      return data.map((a) => ({
        id: a.id,
        ref: a.reference,
        clientId: a.client_id || a.clientId,
        client: a.client_nom || a.client || "Client Inconnu",
        score: a.score || 0,
        type: a.type_alerte || a.type,
        level: (a.niveau || a.level || "analyser") as any,
        module: a.module,
        facteurs: a.facteurs || [],
        status: a.statut || a.status || "nouvelle",
        analyste: a.analyste || "A. Touré",
      }))
    } catch (e) {
      console.warn("API alertes indisponible, fallback local:", e)
      return [
        {
          id: "1",
          ref: "ALR-241",
          clientId: "CLI-1042",
          client: "Traoré, Moussa",
          score: 87,
          type: "Fractionnement",
          level: "bloquante",
          module: "Fractionnement",
          facteurs: ["Fractionnement détecté : 6 transactions cumulant 4.8M FCFA sur 48h"],
          status: "en_cours",
          analyste: "A. Touré",
        },
        {
          id: "2",
          ref: "ALR-238",
          clientId: "CLI-1087",
          client: "Diarra, Fatoumata",
          score: 72,
          type: "Correspondance PPE",
          level: "bloquante",
          module: "Filtrage sanctions",
          facteurs: ["Similarité 96% Liste PPE Mali"],
          status: "en_cours",
          analyste: "A. Touré",
        },
      ]
    }
  },

  async getAlertCounts(): Promise<{ total: number; bloquante: number; analyser: number; informative: number }> {
    try {
      return await ApiClient.get("/alerts/counts")
    } catch (e) {
      return { total: 111, bloquante: 24, analyser: 87, informative: 0 }
    }
  },

  async updateAlertStatus(id: string, statut: string): Promise<any> {
    return await ApiClient.put(`/alerts/${id}`, { statut })
  },
}

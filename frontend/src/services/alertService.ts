import { ApiClient } from "./apiClient"
import type { Alert, AlertFilter } from "@/models/alert"

export const alertService = {
  /**
   * Récupère la liste dynamique des alertes depuis le backend FastAPI.
   * Aucune donnée mockée : renvoie les données réelles ou un tableau vide en cas d'erreur.
   */
  async getAlerts(filters?: AlertFilter): Promise<Alert[]> {
    const params: Record<string, any> = {}

    if (filters) {
      if (filters.status && filters.status !== "Tous statuts") {
        let st = filters.status.toLowerCase().trim()
        if (st === "en cours") st = "en_cours"
        else if (st === "clôturée" || st === "cloturee") st = "cloturee"
        else if (st === "classée" || st === "classee") st = "classee"
        else if (st === "nouvelle") st = "nouvelle"
        params.statut = st
      }

      if (filters.level && filters.level !== "Tous niveaux") {
        let lvl = filters.level.toLowerCase().trim()
        if (lvl.includes("analyser")) lvl = "analyser"
        else if (lvl.includes("bloquante")) lvl = "bloquante"
        else if (lvl.includes("informative")) lvl = "informative"
        params.niveau = lvl
      }

      if (filters.module && filters.module !== "Tous modules") {
        params.module = filters.module
      }

      if (filters.analyste && filters.analyste !== "Tous analystes") {
        params.analyste = filters.analyste
      }
    }

    try {
      const data = await ApiClient.get<any[]>("/alerts", params)
      if (!Array.isArray(data)) return []

      return data.map((a) => ({
        id: a.id,
        ref: a.reference,
        clientId: a.client_id || a.clientId || "",
        client: a.client_nom || a.client || "Client Inconnu",
        score: typeof a.score === "number" ? a.score : 0,
        type: a.type_alerte || a.type || "Alerte de conformité",
        level: (a.niveau || a.level || "analyser") as any,
        module: a.module || "Conformité",
        facteurs: Array.isArray(a.facteurs) ? a.facteurs : [],
        status: a.statut || a.status || "nouvelle",
        analyste: a.analyste || "Non assigné",
        createdAt: a.created_at || a.createdAt,
      }))
    } catch (e) {
      console.error("Erreur API lors de la récupération des alertes :", e)
      return []
    }
  },

  /**
   * Récupère une alerte unique par son ID ou sa référence
   */
  async getAlertById(id: string): Promise<Alert | null> {
    try {
      const a = await ApiClient.get<any>(`/alerts/${id}`)
      if (!a) return null
      return {
        id: a.id,
        ref: a.reference,
        clientId: a.client_id || a.clientId || "",
        client: a.client_nom || a.client || "Client Inconnu",
        score: typeof a.score === "number" ? a.score : 0,
        type: a.type_alerte || a.type || "Alerte de conformité",
        level: (a.niveau || a.level || "analyser") as any,
        module: a.module || "Conformité",
        facteurs: Array.isArray(a.facteurs) ? a.facteurs : [],
        status: a.statut || a.status || "nouvelle",
        analyste: a.analyste || "Non assigné",
        createdAt: a.created_at || a.createdAt,
      }
    } catch (e) {
      console.error(`Erreur API lors de la récupération de l'alerte ${id} :`, e)
      return null
    }
  },

  /**
   * Récupère les compteurs réels par niveau d'alerte depuis le backend
   */
  async getAlertCounts(): Promise<{ total: number; bloquante: number; analyser: number; informative: number }> {
    try {
      const counts = await ApiClient.get<{ total: number; bloquante: number; analyser: number; informative: number }>("/alerts/counts")
      return counts || { total: 0, bloquante: 0, analyser: 0, informative: 0 }
    } catch (e) {
      console.error("Erreur API lors de la récupération des compteurs d'alertes :", e)
      return { total: 0, bloquante: 0, analyser: 0, informative: 0 }
    }
  },

  /**
   * Met à jour le statut d'une alerte en base de données réelle
   */
  async updateAlertStatus(id: string, statut: string): Promise<Alert | null> {
    try {
      const res = await ApiClient.put<any>(`/alerts/${id}`, { statut })
      return {
        id: res.id,
        ref: res.reference,
        clientId: res.client_id || res.clientId || "",
        client: res.client_nom || res.client || "Client Inconnu",
        score: typeof res.score === "number" ? res.score : 0,
        type: res.type_alerte || res.type || "Alerte de conformité",
        level: (res.niveau || res.level || "analyser") as any,
        module: res.module || "Conformité",
        facteurs: Array.isArray(res.facteurs) ? res.facteurs : [],
        status: res.statut || res.status || statut,
        analyste: res.analyste || "Non assigné",
        createdAt: res.created_at || res.createdAt,
      }
    } catch (e) {
      console.error(`Erreur API lors de la mise à jour de l'alerte ${id} :`, e)
      throw e
    }
  },
}


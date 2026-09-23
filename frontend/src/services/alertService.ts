import { ApiClient } from "./apiClient"
import type { Alert, AlertFilter } from "@/models/alert"

export interface AlertsPageResult {
  data: Alert[]
  total: number
}

export function sanitizeFacteurs(facteurs: any): string[] {
  if (!facteurs) return []
  if (!Array.isArray(facteurs)) {
    if (typeof facteurs === "string") return [facteurs]
    if (typeof facteurs === "object") {
      return [facteurs.description || facteurs.critere || JSON.stringify(facteurs)]
    }
    return [String(facteurs)]
  }
  return facteurs
    .map((f) => {
      if (!f) return ""
      if (typeof f === "string") return f
      if (typeof f === "object") {
        return f.description || f.critere || JSON.stringify(f)
      }
      return String(f)
    })
    .filter(Boolean)
}

function buildAlertParams(filters?: AlertFilter): Record<string, any> {
  const params: Record<string, any> = {}
  if (!filters) return params

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

  return params
}

function mapAlertFromBackend(a: any): Alert {
  return {
    id: a.id,
    ref: a.reference,
    clientId: a.client_id || a.clientId || "",
    client: a.client_nom || a.client || "Client Inconnu",
    score: typeof a.score === "number" ? a.score : 0,
    type: a.type_alerte || a.type || "Alerte de conformité",
    level: (a.niveau || a.level || "analyser") as any,
    module: a.module || "Conformité",
    facteurs: sanitizeFacteurs(a.facteurs),
    status: a.statut || a.status || "nouvelle",
    analyste: a.analyste || "Non assigné",
    createdAt: a.created_at || a.createdAt,
  }
}

export const alertService = {
  /**
   * Récupère la liste dynamique des alertes depuis le backend FastAPI.
   * Aucune donnée mockée : renvoie les données réelles ou un tableau vide en cas d'erreur.
   */
  async getAlerts(filters?: AlertFilter): Promise<Alert[]> {
    try {
      const data = await ApiClient.get<any[]>("/alerts", buildAlertParams(filters))
      if (!Array.isArray(data)) return []
      return data.map(mapAlertFromBackend)
    } catch (e) {
      console.error("Erreur API lors de la récupération des alertes :", e)
      return []
    }
  },

  /**
   * Variante paginée (skip/limit + total réel via X-Total-Count) pour les
   * tableaux d'alertes qui doivent naviguer page par page.
   */
  async getAlertsPage(
    filters: AlertFilter | undefined,
    page: { skip: number; limit: number },
    extra?: { q?: string; niveau?: string; statut?: string }
  ): Promise<AlertsPageResult> {
    try {
      const { data, total } = await ApiClient.getPaginated<any>("/alerts", {
        ...buildAlertParams(filters),
        ...(extra?.niveau ? { niveau: extra.niveau } : {}),
        ...(extra?.statut ? { statut: extra.statut } : {}),
        q: extra?.q || undefined,
        skip: page.skip,
        limit: page.limit,
      })
      return { data: data.map(mapAlertFromBackend), total }
    } catch (e) {
      console.error("Erreur API lors de la récupération des alertes :", e)
      return { data: [], total: 0 }
    }
  },

  /**
   * Récupère une alerte unique par son ID ou sa référence
   */
  async getAlertById(id: string): Promise<Alert | null> {
    try {
      const a = await ApiClient.get<any>(`/alerts/${id}`)
      if (!a) return null
      return mapAlertFromBackend(a)
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
   * Met à jour le statut ou les champs d'une alerte en base de données réelle
   */
  async updateAlertStatus(
    id: string,
    update: string | { statut?: string; analyste?: string; niveau?: string }
  ): Promise<Alert | null> {
    try {
      const payload = typeof update === "string" ? { statut: update } : update
      const res = await ApiClient.put<any>(`/alerts/${id}`, payload)
      return {
        id: res.id,
        ref: res.reference,
        clientId: res.client_id || res.clientId || "",
        client: res.client_nom || res.client || "Client Inconnu",
        score: typeof res.score === "number" ? res.score : 0,
        type: res.type_alerte || res.type || "Alerte de conformité",
        level: (res.niveau || res.level || "analyser") as any,
        module: res.module || "Conformité",
        facteurs: sanitizeFacteurs(res.facteurs),
        status: res.statut || res.status || (typeof update === "string" ? update : update.statut || "nouvelle"),
        analyste: res.analyste || (typeof update === "object" ? update.analyste : undefined) || "Non assigné",
        createdAt: res.created_at || res.createdAt,
      }
    } catch (e) {
      console.error(`Erreur API lors de la mise à jour de l'alerte ${id} :`, e)
      throw e
    }
  },
}

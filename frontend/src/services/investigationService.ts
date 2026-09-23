import { ApiClient } from "./apiClient"
import type { Investigation, InvestigationDecisionPayload } from "@/models/investigation"

export interface InvestigationsPageResult {
  data: Investigation[]
  total: number
}

function mapInvestigationFromBackend(i: any): Investigation {
  return {
    ref: i.reference || i.ref,
    client: i.client_nom || i.client || "Client Inconnu",
    alertRef: i.alerte_ref || i.alertRef || "ALR-000",
    type: i.type_motif || i.type || "Dossier",
    analyste: i.analyste || "A. Touré",
    status: i.status || "en_cours",
    dateOuverture: i.date_ouverture ? new Date(i.date_ouverture).toLocaleDateString("fr-FR") : "25/08/2026",
    dateCloture: i.date_cloture ? new Date(i.date_cloture).toLocaleDateString("fr-FR") : undefined,
    decision: i.decision,
    notes: i.notes_count || i.notes || 1,
    pieces: i.pieces_count || i.pieces || 0,
    score: i.score || 75,
  }
}

export const investigationService = {
  async getInvestigations(status?: string): Promise<Investigation[]> {
    try {
      const data = await ApiClient.get<any[]>("/investigations", status ? { status } : undefined)
      return data.map(mapInvestigationFromBackend)
    } catch (e) {
      console.error("Erreur API investigations :", e)
      return []
    }
  },

  async getInvestigationsPage(status: string | undefined, page: { skip: number; limit: number }): Promise<InvestigationsPageResult> {
    try {
      const { data, total } = await ApiClient.getPaginated<any>("/investigations", {
        status,
        skip: page.skip,
        limit: page.limit,
      })
      return { data: data.map(mapInvestigationFromBackend), total }
    } catch (e) {
      console.error("Erreur API investigations :", e)
      return { data: [], total: 0 }
    }
  },

  async createInvestigation(payload: { reference: string; client_id: string; analyste: string; type_motif?: string; alerte_id?: string; journal_notes?: string }): Promise<any> {
    return await ApiClient.post("/investigations", payload)
  },

  async closeInvestigation(idOrRef: string, payload: InvestigationDecisionPayload): Promise<any> {
    return await ApiClient.post(`/investigations/${idOrRef}/close`, payload)
  },

  async reopenInvestigation(idOrRef: string): Promise<any> {
    return await ApiClient.post(`/investigations/${idOrRef}/reopen`, {})
  },
}

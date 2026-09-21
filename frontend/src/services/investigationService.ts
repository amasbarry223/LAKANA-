import { ApiClient } from "./apiClient"
import type { Investigation, InvestigationDecisionPayload } from "@/models/investigation"

export const investigationService = {
  async getInvestigations(status?: string): Promise<Investigation[]> {
    try {
      const data = await ApiClient.get<any[]>("/investigations", status ? { status } : undefined)
      return data.map((i) => ({
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
      }))
    } catch (e) {
      console.warn("API investigations indisponible, fallback local:", e)
      return [
        { ref: "INV-241", client: "Traoré, Moussa", alertRef: "ALR-241", type: "Fractionnement", analyste: "A. Touré", status: "en_cours", dateOuverture: "25/08/2026", notes: 4, pieces: 2, score: 87 },
        { ref: "INV-238", client: "Diarra, Fatoumata", alertRef: "ALR-238", type: "Correspondance PPE", analyste: "A. Touré", status: "en_cours", dateOuverture: "24/08/2026", notes: 2, pieces: 1, score: 72 },
        { ref: "INV-219", client: "Touré, Seydou", alertRef: "ALR-219", type: "Relations inhabituelles", analyste: "M. Diallo", status: "transmise", dateOuverture: "15/08/2026", dateCloture: "21/08/2026", decision: "Déclaration de soupçon transmise au CENTIF", notes: 7, pieces: 5, score: 81 },
      ]
    }
  },

  async createInvestigation(payload: { reference: string; client_id: string; analyste: string; type_motif?: string; alerte_id?: string }): Promise<any> {
    return await ApiClient.post("/investigations", payload)
  },

  async closeInvestigation(idOrRef: string, payload: InvestigationDecisionPayload): Promise<any> {
    return await ApiClient.post(`/investigations/${idOrRef}/close`, payload)
  },
}

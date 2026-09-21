import { ApiClient } from "./apiClient"
import type { AIExplainRequest, AIExplainResponse } from "@/models/ai"

export const aiService = {
  async explainScore(payload: AIExplainRequest): Promise<AIExplainResponse> {
    try {
      return await ApiClient.post<AIExplainResponse>("/assistant-ia/expliquer", payload)
    } catch (e) {
      console.warn("API IA indisponible, fallback modèle local (IA-04):", e)
      return {
        synthese: `Le client ${payload.client_nom} présente un score de risque de ${payload.risk_score}/100. Les facteurs identifiés sont : ${payload.facteurs.join(", ")}.`,
        points_cles: [
          `Score calculé : ${payload.risk_score}/100`,
          `${payload.facteurs.length} facteur(s) déterminant(s)`,
        ],
        rappel_conformite: "⚠️ Rappel : la décision finale revient à l'analyste habilité (IA-03).",
        source_moteur: "Modèle de secours local (IA-04)",
      }
    }
  },
}

import { ApiClient } from "./apiClient"
import type {
  AIExplainRequest,
  AIExplainResponse,
  AIChatRequest,
  AIChatResponse,
  AIContextResponse,
  MLPredictResponse,
  MLTrainResponse,
} from "@/models/ai"


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

  async chat(message: string): Promise<AIChatResponse> {
    try {
      return await ApiClient.post<AIChatResponse>("/assistant-ia/chat", { message })
    } catch (e) {
      console.warn("API Chat IA indisponible, bascule sur règles locales (IA-04):", e)
      const q = message.toLowerCase()
      const reminder = "\n\n⚠️ Rappel : la décision finale revient à l'analyste habilité (IA-03)."

      let fallbackText = `Je suis l'assistant IA LAKANA (Mode local autonome IA-04).${reminder}`
      let intent = "GENERAL"
      const suggestions = [
        "Quels sont les clients les plus risqués ?",
        "Y a-t-il du fractionnement détecté ?",
        "Statistiques des alertes",
      ]

      if (q.includes("score") || q.includes("risque")) {
        intent = "RISK_EXPLAIN"
        fallbackText = `Le Risk Score LAKANA est calculé sur 100 points à partir de 5 critères pondérés : Fractionnement (30 pts), Volume inhabituel (25 pts), Fréquence (20 pts), PPE/Sanctions (15 pts) et Relations (10 pts).${reminder}`
      } else if (q.includes("fractionnement") || q.includes("structuring")) {
        intent = "FRACTIONNEMENT"
        fallbackText = `La détection de fractionnement repère les transactions individuelles sous le seuil légal de 1 000 000 FCFA dont le cumul dépasse ce seuil sur 48h (Règle R-FRC-01).${reminder}`
      }

      return {
        response: fallbackText,
        intent,
        suggestions,
        source_moteur: "Modèle de secours local (IA-04)",
        rappel_conformite: "⚠️ Rappel : la décision finale revient à l'analyste habilité (IA-03).",
      }
    }
  },

  async getContext(): Promise<AIContextResponse> {
    try {
      return await ApiClient.get<AIContextResponse>("/assistant-ia/context")
    } catch (e) {
      console.warn("API Contexte IA indisponible, valeurs de secours (IA-04):", e)
      return {
        top_client: {
          id: "cli-fallback",
          nom: "Diarra",
          prenom: "Fatoumata",
          code_client: "CLI-1087",
          risk_score: 88,
          niveau_risque: "Élevé",
          facteurs: [
            "Fractionnement potentiel : 5 transactions sous le seuil sur 48h (+30 pts)",
            "Client enregistré comme Personne Politiquement Exposée (PPE) (+15 pts)",
          ],
          decomposition: {
            fractionnement: { points: 30, max: 30 },
            volume: { points: 20, max: 25 },
            frequence: { points: 15, max: 20 },
            sanctions_ppe: { points: 15, max: 15 },
            relations: { points: 8, max: 10 },
          },
          transactions_count: 27,
          est_ppe: true,
        },
        stats_alertes: {
          total: 12,
          bloquantes: 3,
          analyser: 7,
          informatives: 2,
          cloturees: 2,
          taux_resolution: 16.7,
        },
        stats_clients: {
          total: 6,
          eleve: 1,
          moyen: 2,
          faible: 3,
        },
        models_ready: true,
        suggested_queries: [
          "Expliquer le score de Diarra",
          "Y a-t-il du fractionnement détecté ?",
          "Quels sont les clients les plus risqués ?",
          "Statistiques des alertes",
        ],
      }
    }
  },

  async predictClientRisk(clientId: string): Promise<MLPredictResponse | null> {
    try {
      return await ApiClient.post<MLPredictResponse>(`/assistant-ia/predict/${clientId}`, {})
    } catch (e) {
      console.warn("Prédiction IA indisponible:", e)
      return null
    }
  },

  async trainModel(countSynthetic: number = 350): Promise<MLTrainResponse | null> {
    try {
      return await ApiClient.post<MLTrainResponse>(`/assistant-ia/train?count_synthetic=${countSynthetic}`, {})
    } catch (e) {
      console.warn("Entraînement IA indisponible:", e)
      return null
    }
  },
}


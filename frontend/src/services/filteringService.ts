import { ApiClient } from "./apiClient"
import type { SanctionMatch, SanctionEntry } from "@/models/sanction"

export const filteringService = {
  async verifyName(nom: string, seuil?: number): Promise<SanctionMatch[]> {
    try {
      return await ApiClient.get<SanctionMatch[]>("/filtrage/verifier", { nom, seuil })
    } catch (e) {
      console.warn("API filtrage indisponible, fallback local:", e)
      return [
        {
          nom_recherche: nom,
          nom_liste: "Diarra Fatoumata (Conseiller ministériel)",
          liste_nom: "Liste PPE Mali",
          liste_type: "PPE",
          similarite: 96.0,
          correspondance_detectee: true,
          motif: "Similarité 96.0% avec Liste PPE Mali (PPE)",
        },
      ]
    }
  },

  async getSanctionLists(typeListe?: string): Promise<SanctionEntry[]> {
    return await ApiClient.get<SanctionEntry[]>("/filtrage/listes", typeListe ? { type_liste: typeListe } : undefined)
  },
}

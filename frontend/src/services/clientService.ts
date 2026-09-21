import { ApiClient } from "./apiClient"
import type { Client } from "@/models/client"

export const clientService = {
  async getClients(query?: string): Promise<Client[]> {
    try {
      return await ApiClient.get<Client[]>("/clients", query ? { q: query } : undefined)
    } catch (e) {
      console.warn("API clients indisponible, fallback local:", e)
      return [
        {
          id: "c1",
          codeClient: "CLI-1042",
          nom: "Traoré",
          prenom: "Moussa",
          profession: "Commerçant import-export",
          ville: "Bamako",
          estPpe: false,
          niveauRisque: "Élevé",
          riskScore: 87,
        },
        {
          id: "c2",
          codeClient: "CLI-1087",
          nom: "Diarra",
          prenom: "Fatoumata",
          profession: "Cadre d'administration",
          ville: "Bamako",
          estPpe: true,
          niveauRisque: "Élevé",
          riskScore: 72,
        },
      ]
    }
  },

  async getClientById(id: string): Promise<Client> {
    return await ApiClient.get<Client>(`/clients/${id}`)
  },

  async getClientScore(id: string): Promise<any> {
    return await ApiClient.get(`/clients/${id}/score`)
  },

  async createClient(payload: Partial<Client>): Promise<Client> {
    return await ApiClient.post<Client>("/clients", payload)
  },
}

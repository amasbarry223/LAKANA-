import { ApiClient } from "./apiClient"
import type { SanctionMatch, SanctionEntry } from "@/models/sanction"

export interface CompteInfo {
  numero_compte: string
  type_compte: string
  solde: number
  devise?: string
  date_ouverture?: string
  is_recent?: boolean
}

export interface PreCheckResult {
  found: boolean
  client_id: string
  client_nom: string
  code_client: string
  is_ppe: boolean
  is_sanctioned: boolean
  bloquer_operations: boolean
  niveau: "bloquante" | "analyser" | "conforme"
  liste_sanction?: string
  reference_sanction?: string
  fonction_ppe?: string
  type_ppe?: string
  has_multi_accounts?: boolean
  comptes_count?: number
  comptes?: CompteInfo[]
  identifiant_cle?: string
  has_recent_new_account?: boolean
  message: string
  consigne_guichet: string
}

export interface DispatchedNotification {
  id: string
  channel: "WhatsApp" | "Email" | string
  destinataire: string
  alerte_ref: string
  type_alerte: string
  niveau: string
  client_nom: string
  montant_fcfa?: number
  contenu: string
  statut_envoi: string
  created_at: string
}

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

  async preCheckGuichet(clientId: string): Promise<PreCheckResult> {
    return await ApiClient.get<PreCheckResult>(`/filtrage/pre-check-guichet/${clientId}`)
  },

  async getDispatchedNotifications(): Promise<DispatchedNotification[]> {
    return await ApiClient.get<DispatchedNotification[]>("/filtrage/notifications-dispatched")
  },

  async getDispatchedNotificationsPage(page: {
    skip: number
    limit: number
  }): Promise<{ data: DispatchedNotification[]; total: number }> {
    try {
      return await ApiClient.getPaginated<DispatchedNotification>("/filtrage/notifications-dispatched", page)
    } catch (e) {
      console.warn("API filtrage indisponible, fallback local:", e)
      return { data: [], total: 0 }
    }
  },

  async testDispatch(phone?: string, email?: string): Promise<any> {
    return await ApiClient.post<any>("/filtrage/test-dispatch", { phone, email })
  },
}


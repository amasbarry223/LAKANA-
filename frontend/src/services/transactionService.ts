import { ApiClient } from "./apiClient"
import type { Transaction, TransactionCreatePayload } from "@/models/transaction"

export interface SimulationResult {
  transaction: Transaction
  alerte_declenchee?: {
    reference: string
    type_alerte: string
    niveau: string
    score: number
    module: string
    facteurs: string[]
  } | null
  nouveau_solde?: number | null
  seuil_uemoa_depasse: boolean
}

function mapFromBackend(raw: any): Transaction {
  return {
    id: raw.id,
    reference: raw.reference,
    clientId: raw.client_id || raw.clientId,
    compteSourceId: raw.compte_source_id || raw.compteSourceId,
    compteDestinationId: raw.compte_destination_id || raw.compteDestinationId,
    beneficiaireNom: raw.beneficiaire_nom || raw.beneficiaireNom,
    montant: Number(raw.montant) || 0,
    devise: raw.devise || "XOF",
    typeOperation: raw.type_operation || raw.typeOperation || "Dépôt",
    canal: raw.canal || "Guichet",
    description: raw.description || "",
    dateTransaction: raw.date_transaction || raw.dateTransaction || new Date().toISOString(),
  }
}

function mapToBackend(payload: TransactionCreatePayload): any {
  return {
    reference: payload.reference,
    client_id: payload.clientId,
    compte_source_id: payload.compteSourceId || null,
    compte_destination_id: payload.compteDestinationId || null,
    beneficiaire_nom: payload.beneficiaireNom || null,
    montant: Number(payload.montant),
    devise: payload.devise || "XOF",
    type_operation: payload.typeOperation || "Dépôt",
    canal: payload.canal || "Guichet",
    description: payload.description || null,
  }
}

export interface TransactionsPageResult {
  data: Transaction[]
  total: number
}

export const transactionService = {
  async getTransactions(limit = 100): Promise<Transaction[]> {
    try {
      const raw = await ApiClient.get<any[]>("/transactions", { limit })
      return Array.isArray(raw) ? raw.map(mapFromBackend) : []
    } catch (e) {
      console.error("Erreur récupération transactions:", e)
      return []
    }
  },

  async getTransactionsPage(
    page: { skip: number; limit: number },
    filters?: { q?: string; typeOperation?: string; montantMin?: number; montantMax?: number }
  ): Promise<TransactionsPageResult> {
    try {
      const { data, total } = await ApiClient.getPaginated<any>("/transactions", {
        ...page,
        q: filters?.q || undefined,
        type_operation: filters?.typeOperation || undefined,
        montant_min: filters?.montantMin,
        montant_max: filters?.montantMax,
      })
      return { data: data.map(mapFromBackend), total }
    } catch (e) {
      console.error("Erreur récupération transactions:", e)
      return { data: [], total: 0 }
    }
  },

  async getClientTransactions(clientId: string): Promise<Transaction[]> {
    try {
      const raw = await ApiClient.get<any[]>(`/transactions/client/${clientId}`)
      return Array.isArray(raw) ? raw.map(mapFromBackend) : []
    } catch (e) {
      console.error("Erreur transactions client:", e)
      return []
    }
  },

  async getClientTransactionsPage(clientId: string, page: { skip: number; limit: number }): Promise<TransactionsPageResult> {
    try {
      const { data, total } = await ApiClient.getPaginated<any>(`/transactions/client/${clientId}`, page)
      return { data: data.map(mapFromBackend), total }
    } catch (e) {
      console.error("Erreur transactions client:", e)
      return { data: [], total: 0 }
    }
  },

  async recordTransaction(payload: TransactionCreatePayload): Promise<Transaction> {
    const body = mapToBackend(payload)
    const raw = await ApiClient.post<any>("/transactions", body)
    return mapFromBackend(raw)
  },

  async simulateTransaction(payload: TransactionCreatePayload): Promise<SimulationResult> {
    const body = mapToBackend(payload)
    const res = await ApiClient.post<any>("/transactions/simuler", body)
    return {
      transaction: mapFromBackend(res.transaction),
      alerte_declenchee: res.alerte_declenchee,
      nouveau_solde: res.nouveau_solde,
      seuil_uemoa_depasse: Boolean(res.seuil_uemoa_depasse),
    }
  },
}

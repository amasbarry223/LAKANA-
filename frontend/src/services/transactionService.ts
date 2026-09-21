import { ApiClient } from "./apiClient"
import type { Transaction, TransactionCreatePayload } from "@/models/transaction"

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    return await ApiClient.get<Transaction[]>("/transactions")
  },

  async getClientTransactions(clientId: string): Promise<Transaction[]> {
    return await ApiClient.get<Transaction[]>(`/transactions/client/${clientId}`)
  },

  async recordTransaction(payload: TransactionCreatePayload): Promise<Transaction> {
    return await ApiClient.post<Transaction>("/transactions", payload)
  },
}

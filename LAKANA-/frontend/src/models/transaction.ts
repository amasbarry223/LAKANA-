export interface Transaction {
  id: string
  reference: string
  clientId: string
  compteSourceId?: string
  compteDestinationId?: string
  beneficiaireNom?: string
  montant: number
  devise: string
  typeOperation: string
  canal: string
  description?: string
  dateTransaction: string
}

export interface TransactionCreatePayload {
  reference: string
  clientId: string
  compteSourceId?: string
  compteDestinationId?: string
  beneficiaireNom?: string
  montant: number
  devise?: string
  typeOperation?: string
  canal?: string
  description?: string
}

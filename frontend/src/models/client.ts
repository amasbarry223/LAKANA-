export interface Account {
  id: string
  numeroCompte: string
  clientId: string
  typeCompte: "Courant" | "Épargne" | "Tontine" | "Micro-crédit" | string
  solde: number
  devise: string
  dateOuverture?: string
}

export interface RiskDecomposition {
  fractionnement: { points: number; max: number }
  volume: { points: number; max: number }
  frequence: { points: number; max: number }
  sanctions_ppe: { points: number; max: number }
  relations: { points: number; max: number }
}

export interface Client {
  id: string
  codeClient: string
  nom: string
  prenom?: string
  dateNaissance?: string
  profession?: string
  ville?: string
  pays?: string
  telephone?: string
  estPpe: boolean
  niveauRisque: "Élevé" | "Moyen" | "Faible"
  riskScore: number
  comptes?: Account[]
  createdAt?: string
  decomposition?: RiskDecomposition
  facteurs?: string[]
}

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

  // Type : Particulier ou Entreprise
  typeClient?: "Particulier" | "Entreprise" | string

  // Entreprise
  raisonSociale?: string
  formeJuridique?: string
  rccm?: string
  nif?: string
  secteurActivite?: string
  beneficiaireEffectif?: string

  // Particulier & PPE
  pieceIdentite?: string
  estPpe: boolean
  fonctionPpe?: string
  typePpe?: string
  paysMandat?: string

  niveauRisque: "Élevé" | "Moyen" | "Faible" | string
  riskScore: number
  comptes?: Account[]
  createdAt?: string
  decomposition?: RiskDecomposition
  facteurs?: string[]
}

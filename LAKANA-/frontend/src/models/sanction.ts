export interface SanctionMatch {
  nom_recherche: string
  nom_liste: string
  liste_nom: string
  liste_type: "ONU" | "GAFI" | "CENTIF" | "PPE" | string
  similarite: number
  correspondance_detectee: boolean
  motif: string
}

export interface SanctionEntry {
  id: string
  codeEntree?: string
  nomComplet: string
  aliases?: string
  listeType: string
  listeNom: string
  titreFonction?: string
  nationalite: string
}

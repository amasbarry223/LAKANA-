export interface AIExplainRequest {
  client_nom: string
  client_code?: string
  risk_score: number
  facteurs: string[]
  alerte_ref?: string
}

export interface AIExplainResponse {
  synthese: string
  points_cles: string[]
  rappel_conformite: string
  source_moteur: string
}

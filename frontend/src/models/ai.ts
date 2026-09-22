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

export interface AIChatRequest {
  message: string
}

export interface AIChatResponse {
  response: string
  intent: string
  suggestions: string[]
  context_client?: {
    id: string
    nom: string
    prenom?: string
    code_client: string
    risk_score: number
    niveau_risque: string
    facteurs: string[]
    decomposition?: Record<string, { points: number; max: number }>
    transactions_count?: number
    est_ppe?: boolean
    profession?: string
  }
  points_cles?: string[]
  source_moteur: string
  rappel_conformite: string
}

export interface AIContextResponse {
  top_client?: {
    id: string
    nom: string
    prenom?: string
    code_client: string
    risk_score: number
    niveau_risque: string
    facteurs: string[]
    decomposition?: Record<string, { points: number; max: number }>
    transactions_count?: number
    est_ppe?: boolean
  }
  stats_alertes: {
    total: number
    bloquantes: number
    analyser: number
    informatives: number
    cloturees: number
    taux_resolution: number
  }
  stats_clients: {
    total: number
    eleve: number
    moyen: number
    faible: number
  }
  models_ready: boolean
  suggested_queries: string[]
}

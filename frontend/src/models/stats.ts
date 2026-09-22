export interface AuditLogEntry {
  id: string
  utilisateur: string
  role: string
  action: string
  module: string
  cible?: string
  details?: string
  ipAddress?: string
  timestamp: string
}

export interface DashboardStats {
  clients_filtres: string
  alertes_actives: number
  alertes_bloquantes: number
  alertes_analyser?: number
  investigations_en_cours: number
  score_moyen: string
}

export interface ModuleStat {
  nom: string
  code: string
  count: number
}

export interface GuichetAlert {
  reference: string
  type: string
  niveau: string
  client_nom: string
  score: number
  statut: string
  date: string
  agence: string
}

export interface GuichetStats {
  operations_du_jour: number
  operations_bloquees: number
  volume_traite_fcfa: number
  taux_conformite: string
  depots_count: number
  retraits_count: number
  hourly_flow: Array<{ heure: string; depots: number; retraits: number; suspects: number }>
  recent_alerts: GuichetAlert[]
}

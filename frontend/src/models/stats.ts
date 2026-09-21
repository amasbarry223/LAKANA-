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
  investigations_en_cours: number
  score_moyen: string
}

export interface ModuleStat {
  nom: string
  code: string
  count: number
}

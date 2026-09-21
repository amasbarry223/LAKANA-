import { ApiClient } from "./apiClient"
import type { DashboardStats, ModuleStat } from "@/models/stats"
import type { AuditLogEntry } from "@/models/stats"

export const statsService = {
  async getDashboardOverview(): Promise<{ stats: DashboardStats; modules: ModuleStat[]; statut_systeme: string }> {
    try {
      return await ApiClient.get("/stats/overview")
    } catch (e) {
      return {
        stats: {
          clients_filtres: "10 585",
          alertes_actives: 111,
          alertes_bloquantes: 24,
          investigations_en_cours: 3,
          score_moyen: "42/100",
        },
        modules: [
          { nom: "Filtrage sanctions/PPE", code: "FLT", count: 1203 },
          { nom: "Détection comportementale", code: "CMP", count: 287 },
          { nom: "Fractionnement", code: "FRC", count: 167 },
          { nom: "Risk Score recalculé", code: "SCR", count: 456 },
        ],
        statut_systeme: "Opérationnel",
      }
    }
  },
}

export const auditService = {
  async getAuditLogs(params?: { module?: string; action?: string }): Promise<AuditLogEntry[]> {
    try {
      return await ApiClient.get<AuditLogEntry[]>("/audit", params)
    } catch (e) {
      return [
        {
          id: "log1",
          utilisateur: "Aminata Touré",
          role: "Analyste conformité",
          action: "Prise en charge alerte",
          module: "Centre d'alertes",
          cible: "ALR-241",
          details: "Ouverture du dossier INV-241 pour suspicion de fractionnement",
          ipAddress: "127.0.0.1",
          timestamp: new Date().toISOString(),
        },
      ]
    }
  },
}

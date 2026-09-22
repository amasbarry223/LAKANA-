import { ApiClient } from "./apiClient"
import type { DashboardStats, ModuleStat } from "@/models/stats"
import type { AuditLogEntry } from "@/models/stats"

export type FunnelStep = {
  name: string
  value: number
  pct: number
  color: string
}

export type FunnelReason = {
  label: string
  count: number
  pct: number
  color: string
  clients: { client: string; ref: string; score: number; level: string }[]
}

export type FunnelInsight = {
  icon: string
  iconBg: string
  iconColor: string
  title: string
  desc: string
  accent: string
  target: string
  clientId?: string
}

export type FunnelData = {
  steps: FunnelStep[]
  reasons: FunnelReason[]
  insights: FunnelInsight[]
  total_alerts: number
}

export const statsService = {
  async getDashboardOverview(): Promise<{
    stats: DashboardStats
    modules: ModuleStat[]
    trend?: { date: string; alertes: number; investigations: number }[]
    statut_systeme: string
  }> {
    try {
      return await ApiClient.get("/stats/overview")
    } catch (e) {
      return {
        stats: {
          clients_filtres: "6",
          alertes_actives: 6,
          alertes_bloquantes: 2,
          investigations_en_cours: 2,
          score_moyen: "56/100",
        },
        modules: [
          { nom: "Filtrage sanctions/PPE", code: "FLT", count: 2 },
          { nom: "Détection comportementale", code: "CMP", count: 2 },
          { nom: "Fractionnement", code: "FRC", count: 1 },
          { nom: "Risk Score recalculé", code: "SCR", count: 1 },
        ],
        trend: [
          { date: "S1", alertes: 1, investigations: 0 },
          { date: "S2", alertes: 2, investigations: 1 },
          { date: "S3", alertes: 3, investigations: 1 },
          { date: "S4", alertes: 4, investigations: 2 },
          { date: "S5", alertes: 4, investigations: 2 },
          { date: "S6", alertes: 5, investigations: 2 },
          { date: "S7", alertes: 6, investigations: 3 },
          { date: "S8", alertes: 6, investigations: 3 },
        ],
        statut_systeme: "Opérationnel",
      }
    }
  },

  async getFunnelAnalytics(): Promise<FunnelData> {
    try {
      return await ApiClient.get<FunnelData>("/stats/funnel")
    } catch (e) {
      return {
        steps: [
          { name: "Transactions analysées", value: 1200, pct: 100, color: "#6366F1" },
          { name: "Correspondances PPE/sanctions", value: 120, pct: 10.0, color: "#7C8DF5" },
          { name: "Alertes générées", value: 45, pct: 3.8, color: "#06B6D4" },
          { name: "Investigations ouvertes", value: 12, pct: 1.0, color: "#22D3EE" },
          { name: "Décisions documentées", value: 8, pct: 0.7, color: "#5EEAD4" },
        ],
        reasons: [
          { label: "Fractionnement potentiel", count: 2, pct: 33.3, color: "#6366F1", clients: [{ client: "Traoré, Moussa", ref: "ALR-241", score: 87, level: "bloquante" }] },
          { label: "Correspondance PPE", count: 2, pct: 33.3, color: "#3B82F6", clients: [{ client: "Diarra, Fatoumata", ref: "ALR-238", score: 72, level: "bloquante" }] },
          { label: "Volume inhabituel", count: 2, pct: 33.3, color: "#06B6D4", clients: [{ client: "Keïta, Ibrahim", ref: "ALR-235", score: 64, level: "analyser" }] },
        ],
        insights: [
          {
            icon: "AlertTriangle",
            iconBg: "bg-rose-50",
            iconColor: "text-rose-500",
            title: "Score critique (87/100)",
            desc: "Le client Traoré, Moussa (ALR-241) présente une alerte de type Fractionnement.",
            accent: "text-rose-600",
            target: "Investigations",
            clientId: "CLI-1042",
          },
          {
            icon: "Sparkles",
            iconBg: "bg-cyan-50",
            iconColor: "text-cyan-500",
            title: "Correspondance PPE détectée",
            desc: "Dossier ALR-238 (Diarra, Fatoumata) : revue d'habilitation requise.",
            accent: "text-cyan-600",
            target: "Filtrage sanctions/PPE",
          },
        ],
        total_alerts: 6,
      }
    }
  },

  async getScoreDistribution(): Promise<{
    distribution: { range: string; count: number; pct: number; color: string }[]
    total_clients: number
    score_moyen: number
    score_max: number
    score_min: number
    eleves: number
    moyens: number
    faibles: number
  }> {
    try {
      return await ApiClient.get("/stats/score-distribution")
    } catch (e) {
      return {
        distribution: [
          { range: "0-20", count: 0, pct: 0, color: "#10B981" },
          { range: "21-40", count: 0, pct: 0, color: "#10B981" },
          { range: "41-60", count: 0, pct: 0, color: "#F59E0B" },
          { range: "61-80", count: 0, pct: 0, color: "#F59E0B" },
          { range: "81-100", count: 0, pct: 0, color: "#EF4444" },
        ],
        total_clients: 0,
        score_moyen: 0,
        score_max: 0,
        score_min: 0,
        eleves: 0,
        moyens: 0,
        faibles: 0,
      }
    }
  },

  // ─── 3 REGISTRES RÉGLEMENTAIRES OFFICIELS SFD ──────────────────────────────
  async getRegistreOperationsSuspectes(): Promise<any[]> {
    try {
      return await ApiClient.get<any[]>("/stats/registre-operations-suspectes")
    } catch (e) {
      console.error("Erreur chargement registre opérations suspectes :", e)
      return []
    }
  },

  async getRegistreTransactions15M(): Promise<any[]> {
    try {
      return await ApiClient.get<any[]>("/stats/registre-transactions-15m")
    } catch (e) {
      console.error("Erreur chargement registre transactions 15M :", e)
      return []
    }
  },

  async getRegistrePPE(): Promise<any[]> {
    try {
      return await ApiClient.get<any[]>("/stats/registre-ppe")
    } catch (e) {
      console.error("Erreur chargement registre PPE :", e)
      return []
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

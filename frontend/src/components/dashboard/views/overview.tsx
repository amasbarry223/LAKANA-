"use client"

import { useState, useEffect } from "react"
import {
  Activity,
  ShieldAlert,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  RefreshCw,
  FolderSearch,
  ExternalLink,
  ArrowRight,
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/ui/metric-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { statsService } from "@/services/statsService"
import { alertService } from "@/services/alertService"
import type { DashboardStats, ModuleStat } from "@/models/stats"
import type { Alert } from "@/models/alert"

type TrendPoint = { date: string; alertes: number; investigations: number }

export function OverviewView() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [modules, setModules] = useState<ModuleStat[]>([])
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [statutSysteme, setStatutSysteme] = useState("Opérationnel")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [overviewData, alertsData] = await Promise.all([
        statsService.getDashboardOverview(),
        alertService.getAlerts().catch(() => [] as Alert[]),
      ])

      setStats(overviewData.stats)
      setModules(overviewData.modules)
      if (overviewData.trend) setTrend(overviewData.trend)
      if (overviewData.statut_systeme) setStatutSysteme(overviewData.statut_systeme)
      setRecentAlerts(alertsData.slice(0, 5))
    } catch (e) {
      console.error("Erreur chargement overview:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      {/* En-tête sobre */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tableau de bord
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {statutSysteme}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Supervision consolidée et indicateurs clés de conformité LBC/FT/FP.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex h-8 items-center gap-1.5 self-start rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          title="Actualiser les données"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-indigo-600")} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* ZONE 1 — 4 KPIs essentiels */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard
          label="Clients filtrés"
          value={loading ? "…" : stats?.clients_filtres ?? "0"}
          icon={<Users className="h-4 w-4" />}
          color="indigo"
          subtitle={stats ? `Score moyen : ${stats.score_moyen}/100` : undefined}
          onClick={() => navigateTo("Clients & Enrôlement")}
        />
        <MetricCard
          label="Alertes actives"
          value={loading ? "…" : String(stats?.alertes_actives ?? 0)}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="rose"
          subtitle={stats ? `${stats.alertes_bloquantes} bloquantes` : undefined}
          onClick={() => navigateTo("Centre d'alertes")}
        />
        <MetricCard
          label="Investigations"
          value={loading ? "…" : String(stats?.investigations_en_cours ?? 0)}
          icon={<Clock className="h-4 w-4" />}
          color="amber"
          subtitle="Dossiers ouverts"
          onClick={() => navigateTo("Investigations")}
        />
        <MetricCard
          label="Score moyen"
          value={loading ? "…" : `${stats?.score_moyen ?? 0}/100`}
          icon={<TrendingUp className="h-4 w-4" />}
          color="emerald"
          subtitle={stats ? `${stats.alertes_analyser ?? 0} à analyser` : undefined}
          onClick={() => navigateTo("Risk Score")}
        />
      </div>

      {/* ZONE 2 — Graphique principal (8) + Conformité (4) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Graphique principal (8 cols) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 xl:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Évolution de l'activité (8 semaines)
              </h3>
              <p className="text-xs text-slate-400">Alertes réglementaires vs dossiers d'investigation ouverts.</p>
            </div>
            <div className="flex items-center gap-3 text-2xs font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Alertes
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Investigations
              </span>
            </div>
          </div>

          <div className="mt-4 h-[240px] w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ovA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ovI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="alertes" stroke="#6366F1" strokeWidth={2} fill="url(#ovA)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="investigations" stroke="#F59E0B" strokeWidth={2} fill="url(#ovI)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* État de conformité (4 cols) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 xl:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              État de conformité LBC/FT
            </h3>
            <p className="text-xs text-slate-400">Vérifications obligatoires BCEAO & CENTIF.</p>

            <div className="mt-3.5 space-y-2.5">
              <div
                onClick={() => navigateTo("Filtrage sanctions/PPE")}
                className="flex cursor-pointer items-center justify-between rounded-lg bg-emerald-50/70 p-2.5 transition hover:bg-emerald-50 dark:bg-emerald-950/20"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Listes sanctions</span>
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700 text-2xs py-0">ONU · GAFI · CENTIF</Badge>
              </div>

              <div
                onClick={() => navigateTo("Intégration des données")}
                className="flex cursor-pointer items-center justify-between rounded-lg bg-emerald-50/70 p-2.5 transition hover:bg-emerald-50 dark:bg-emerald-950/20"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Connecteurs SFD</span>
                </div>
                <span className="text-2xs font-semibold text-emerald-700">3/3 connectés</span>
              </div>

              <div
                onClick={() => navigateTo("Investigations")}
                className="flex cursor-pointer items-center justify-between rounded-lg bg-amber-50/70 p-2.5 transition hover:bg-amber-50 dark:bg-amber-950/20"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Dossiers en cours</span>
                </div>
                <span className="text-2xs font-semibold text-amber-700">
                  {loading ? "…" : `${stats?.investigations_en_cours ?? 0} dossiers`}
                </span>
              </div>

              <div
                onClick={() => navigateTo("Centre d'alertes")}
                className="flex cursor-pointer items-center justify-between rounded-lg bg-rose-50/70 p-2.5 transition hover:bg-rose-50 dark:bg-rose-950/20"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span className="text-xs font-medium text-rose-800 dark:text-rose-300">Alertes critiques</span>
                </div>
                <span className="text-2xs font-semibold text-rose-700">
                  {loading ? "…" : `${stats?.alertes_bloquantes ?? 0} bloquantes`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ZONE 3 — Activité récente & Signaux prioritaires (12 cols) */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Signaux prioritaires récents
            </h3>
            <p className="text-xs text-slate-400">Dernières anomalies détectées à instruire en priorité.</p>
          </div>
          <button
            onClick={() => navigateTo("Centre d'alertes")}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <span>Voir tout le centre d'alertes</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Chargement des signaux...</div>
          ) : recentAlerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Aucun signal récent à traiter.</div>
          ) : (
            recentAlerts.map((alert) => (
              <div
                key={alert.id || alert.ref}
                onClick={() => navigateTo("Centre d'alertes")}
                className="flex cursor-pointer items-center justify-between py-3 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-lg px-2 -mx-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono",
                      alert.level === "bloquante"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    )}
                  >
                    {alert.score}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {alert.client}
                    </p>
                    <p className="text-2xs text-slate-400 truncate">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{alert.ref}</span> • {alert.type} ({alert.module})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={alert.level} />
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

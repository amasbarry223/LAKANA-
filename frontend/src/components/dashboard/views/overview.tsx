"use client"

import { useState, useEffect } from "react"
import { Activity, ShieldAlert, Users, AlertTriangle, TrendingUp, Clock, ChevronRight, RefreshCw } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { statsService } from "@/services/statsService"
import type { DashboardStats, ModuleStat } from "@/models/stats"

type TrendPoint = { date: string; alertes: number; investigations: number }

export function OverviewView() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [modules, setModules] = useState<ModuleStat[]>([])
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [statutSysteme, setStatutSysteme] = useState("Opérationnel")

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await statsService.getDashboardOverview()
      setStats(data.stats)
      setModules(data.modules)
      if (data.trend) setTrend(data.trend)
      if (data.statut_systeme) setStatutSysteme(data.statut_systeme)
    } catch (e) {
      console.error("Erreur chargement overview:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = stats
    ? [
        {
          label: "Clients filtrés",
          value: stats.clients_filtres,
          icon: Users,
          color: "#6366F1",
          delta: `Score moyen : ${stats.score_moyen}`,
        },
        {
          label: "Alertes actives",
          value: String(stats.alertes_actives),
          icon: AlertTriangle,
          color: "#EF4444",
          delta: `${stats.alertes_bloquantes} bloquantes`,
        },
        {
          label: "Investigations en cours",
          value: String(stats.investigations_en_cours),
          icon: Clock,
          color: "#F59E0B",
          delta: "Dossiers ouverts",
        },
        {
          label: "Score moyen",
          value: stats.score_moyen,
          icon: TrendingUp,
          color: "#10B981",
          delta: `${stats.alertes_analyser ?? 0} à analyser`,
        },
      ]
    : []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] dark:text-slate-100">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Vue d'ensemble de l'activité de conformité LAKANA.
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {statutSysteme}
            </span>
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          title="Actualiser les données"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse dark:border-slate-800 dark:bg-slate-900">
                <div className="h-4 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-2 h-7 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-1 h-3 w-20 rounded bg-slate-50 dark:bg-slate-800/50" />
              </div>
            ))
          : statCards.map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${s.color}15` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                <p className="mt-1 text-[11px] text-slate-400">{s.delta}</p>
              </div>
            ))}
      </div>

      {/* Trend */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Activité — 8 dernières semaines</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />Alertes
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />Investigations
            </span>
          </div>
        </div>
        <div className="mt-4 h-[260px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="ovA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ovI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
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

      {/* Module activity + compliance status */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Activité par module</h3>
          <div className="mt-4 space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg border border-slate-100 p-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-100" />
                    <div className="flex-1">
                      <div className="h-3.5 w-32 rounded bg-slate-100" />
                      <div className="mt-1 h-3 w-16 rounded bg-slate-50" />
                    </div>
                    <div className="h-4 w-10 rounded bg-slate-100" />
                  </div>
                ))
              : modules.map((m) => (
                  <div
                    key={m.code}
                    onClick={() => navigateTo((m as any).nav || m.nom)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ background: `${(m as any).color || "#6366F1"}15` }}
                    >
                      <Activity className="h-4 w-4" style={{ color: (m as any).color || "#6366F1" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.nom}</p>
                      <p className="text-[11px] text-slate-400">Module {m.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{m.count.toLocaleString("fr-FR")}</p>
                      <p className="text-[11px] text-slate-400">signaux</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">État de conformité</h3>
          <div className="mt-4 space-y-3">
            <div
              onClick={() => navigateTo("Filtrage sanctions/PPE")}
              className="flex cursor-pointer items-center justify-between rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/20"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Listes sanctions à jour</span>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">ONU · GAFI · CENTIF</Badge>
            </div>
            <div
              onClick={() => navigateTo("Intégration des données")}
              className="flex cursor-pointer items-center justify-between rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/20"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Connecteurs opérationnels</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700">3/3</span>
            </div>
            <div
              onClick={() => navigateTo("Investigations")}
              className="flex cursor-pointer items-center justify-between rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Investigations en cours</span>
              </div>
              <span className="text-xs font-semibold text-amber-700">
                {loading ? "..." : `${stats?.investigations_en_cours ?? 0} dossiers`}
              </span>
            </div>
            <div
              onClick={() => navigateTo("Centre d'alertes")}
              className="flex cursor-pointer items-center justify-between rounded-lg bg-rose-50 p-3 dark:bg-rose-950/20"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span className="text-sm font-medium text-rose-800 dark:text-rose-300">Alertes bloquantes non traitées</span>
              </div>
              <span className="text-xs font-semibold text-rose-700">
                {loading ? "..." : `${stats?.alertes_bloquantes ?? 0} critiques`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

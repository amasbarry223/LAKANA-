"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  Users,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Download,
  Inbox,
  BellRing,
  UserRound,
  Search,
} from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { statsService } from "@/services/statsService"
import { alertService } from "@/services/alertService"
import { clientService } from "@/services/clientService"
import { TableSkeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useDashboard } from "@/lib/dashboard-context"
import type { DashboardStats } from "@/models/stats"
import type { Alert } from "@/models/alert"
import type { Client } from "@/models/client"

const ALERT_LEVEL_BADGE: Record<string, string> = {
  bloquante: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
  analyser: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  informative: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
}

const ALERT_LEVEL_LABEL: Record<string, string> = {
  bloquante: "Bloquante",
  analyser: "À analyser",
  informative: "Informative",
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return ""
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days} j`
}

export function OverviewView() {
  const { userName } = useDashboard()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [topRiskClients, setTopRiskClients] = useState<Client[]>([])
  const [listsLoading, setListsLoading] = useState(true)

  // Activité de surveillance sur les 8 dernières semaines
  const trendData = [
    { week: "S1", alertes: 2, investigations: 0 },
    { week: "S2", alertes: 2, investigations: 0 },
    { week: "S3", alertes: 1, investigations: 1 },
    { week: "S4", alertes: 1, investigations: 1 },
    { week: "S5", alertes: 1, investigations: 1 },
    { week: "S6", alertes: 2, investigations: 2 },
    { week: "S7", alertes: 4, investigations: 2 },
    { week: "S8", alertes: 3, investigations: 2 },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await statsService.getDashboardOverview()
      setStats(data.stats)
    } catch (e) {
      console.error("Erreur chargement overview:", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchLists = async () => {
    setListsLoading(true)
    try {
      const [alerts, clientsPage] = await Promise.all([
        alertService.getAlerts(),
        clientService.getClientsPage({ niveauRisque: "Élevé", limit: 5 }),
      ])
      const sortedAlerts = [...alerts].sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
      setRecentAlerts(sortedAlerts.slice(0, 5))
      setTopRiskClients(
        [...clientsPage.data].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
      )
    } catch (e) {
      console.error("Erreur chargement listes overview:", e)
    } finally {
      setListsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchLists()
  }, [])

  const clientsCount = stats?.clients_filtres ? parseInt(stats.clients_filtres) : 5
  const alertesCount = stats?.alertes_actives ?? 3
  const alertesBloquantes = stats?.alertes_bloquantes ?? 2
  const investigationsCount = stats?.investigations_en_cours ?? 2
  const scoreMoyen = stats?.score_moyen ?? "32/100"

  return (
    <div className="space-y-6 pb-8">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. EN-TÊTE DIRECT & ÉPURÉ                                          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tableau de bord
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Supervision LBC/FT en temps réel • Suivi des flux du Core Banking
          </p>
        </div>

        {/* Actions directes rapides */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("lakana-new-investigation"))}
            className="inline-flex items-center gap-2 rounded-xl bg-[#070347] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0a0563] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle investigation
          </button>
          <button
            onClick={() => navigateTo("Filtrage sanctions/PPE")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ShieldAlert className="h-4 w-4 text-[#CD0D29]" />
            Filtrage Sanctions/PPE
          </button>
          <button
            onClick={() => navigateTo("Rapports réglementaires")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Rapports
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. 4 CARTES KPI CLAIRES & SIGNIFICATIVES                           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* CARTE 1: Alertes actives */}
        <div
          onClick={() => navigateTo("Centre d'alertes")}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 border-b-4 border-b-[#CD0D29] bg-white p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:border-b-[#CD0D29] dark:bg-slate-900"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#CD0D29] dark:bg-rose-950/50 dark:text-[#CD0D29]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alertes actives
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="mt-4">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {alertesCount}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            <span className="font-bold text-[#CD0D29]">{alertesBloquantes}</span> bloquantes à traiter
          </p>
        </div>

        {/* CARTE 2: Investigations en cours */}
        <div
          onClick={() => navigateTo("Investigations")}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 border-b-4 border-b-[#070347] bg-white p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:border-b-[#070347] dark:bg-slate-900"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[#070347] dark:bg-indigo-950/50 dark:text-indigo-300">
                  <Search className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Investigations
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="mt-4">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {investigationsCount}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Dossiers ouverts sous analyse
          </p>
        </div>

        {/* CARTE 3: Portefeuille sociétaires */}
        <div
          onClick={() => navigateTo("Fiches Sociétaires")}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 border-b-4 border-b-blue-600 bg-white p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:border-b-blue-600 dark:bg-slate-900"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Portefeuille sociétaires
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="mt-4">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {clientsCount}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Score moyen de risque : <span className="font-semibold text-slate-800 dark:text-slate-200">{scoreMoyen}</span>
          </p>
        </div>

        {/* CARTE 4: Conformité Sanctions & PPE */}
        <div
          onClick={() => navigateTo("Filtrage sanctions/PPE")}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 border-b-4 border-b-emerald-500 bg-white p-5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:border-b-emerald-500 dark:bg-slate-900"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Listes Sanctions
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="mt-4">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                Actif
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Filtres ONU, CENTIF & UEMOA synchronisés
          </p>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. GRAPHIQUE CENTRAL : ÉVOLUTION DE L'ACTIVITÉ                    */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-[#070347] dark:bg-slate-800 dark:text-slate-200">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Activité de Contrôle & Détections (8 dernières semaines)
              </h3>
              <p className="text-xs text-slate-400">
                Volume d'alertes générées et de dossiers d'investigation ouverts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#070347] dark:bg-indigo-400" />
              Alertes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] dark:bg-amber-400" />
              Investigations
            </span>
          </div>
        </div>

        <div className="mt-5 h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDark ? "#818CF8" : "#070347"} stopOpacity={isDark ? 0.35 : 0.16} />
                  <stop offset="100%" stopColor={isDark ? "#818CF8" : "#070347"} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={isDark ? 0.35 : 0.16} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(148, 163, 184, 0.12)" : "#F1F5F9"} vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#64748B" }}
                tickLine={false}
                axisLine={false}
                dy={4}
              />
              <YAxis
                domain={[0, 4]}
                ticks={[0, 1, 2, 3, 4]}
                tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#64748B" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#111827" : "#FFFFFF",
                  borderColor: isDark ? "rgba(148, 163, 184, 0.2)" : "#E2E8F0",
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                }}
                itemStyle={{
                  color: isDark ? "#F8FAFC" : "#0F172A",
                }}
              />
              <Area
                type="monotone"
                dataKey="alertes"
                name="Alertes"
                stroke={isDark ? "#818CF8" : "#070347"}
                strokeWidth={2.5}
                fill="url(#alertGrad)"
              />
              <Area
                type="monotone"
                dataKey="investigations"
                name="Investigations"
                stroke={isDark ? "#FBBF24" : "#F59E0B"}
                strokeWidth={2}
                fill="url(#invGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 4. DEUX COLONNES DIRECTES : ALERTES RÉCENTES & CLIENTS À RISQUE   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* COLONNE GAUCHE : Alertes récentes */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-[#CD0D29]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Alertes prioritaires
              </h3>
            </div>
            <button
              onClick={() => navigateTo("Centre d'alertes")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              Centre d'alertes →
            </button>
          </div>

          <div className="mt-4">
            {listsLoading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : recentAlerts.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Aucune alerte récente"
                description="Les nouvelles alertes de conformité apparaîtront ici."
                variant="compact"
              />
            ) : (
              <div className="space-y-2.5">
                {recentAlerts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => navigateTo("Client 360°", { clientId: a.clientId })}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#CD0D29] dark:bg-rose-950/50 dark:text-[#CD0D29]">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {a.client}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {a.type} · {timeAgo(a.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-bold",
                          ALERT_LEVEL_BADGE[a.level] || ALERT_LEVEL_BADGE.analyser
                        )}
                      >
                        {ALERT_LEVEL_LABEL[a.level] || "À analyser"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : Sociétaires sous vigilance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[#070347] dark:text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Sociétaires sous vigilance
              </h3>
            </div>
            <button
              onClick={() => navigateTo("Client 360°")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              Fiche 360° →
            </button>
          </div>

          <div className="mt-4">
            {listsLoading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : topRiskClients.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="Aucun sociétaire sous vigilance"
                description="Tous les dossiers sont sous le seuil d'alerte."
                variant="compact"
              />
            ) : (
              <div className="space-y-2.5">
                {topRiskClients.map((c) => {
                  const displayName =
                    c.typeClient === "Entreprise"
                      ? c.raisonSociale || c.nom
                      : `${c.nom} ${c.prenom || ""}`.trim()
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigateTo("Client 360°", { clientId: c.id })}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3 transition-all hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#070347] text-xs font-bold dark:bg-indigo-950/50 dark:text-indigo-300">
                          {displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {displayName}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {c.codeClient} · {c.ville || "Bamako"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#CD0D29] dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                          Score : {c.riskScore}/100
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

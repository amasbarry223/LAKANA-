"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Activity,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Globe,
  Share2,
  FileText,
  ShieldAlert,
  Plus,
  Download,
  Inbox,
  BellRing,
  UserRound,
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { statsService } from "@/services/statsService"
import { alertService } from "@/services/alertService"
import { clientService } from "@/services/clientService"
import { TableSkeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useDashboard } from "@/lib/dashboard-context"
import type { DashboardStats, ModuleStat } from "@/models/stats"
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

// Sparkline SVG component for the modules
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 80
  const height = 24
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 6) - 3
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export function OverviewView() {
  const { userName } = useDashboard()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [topRiskClients, setTopRiskClients] = useState<Client[]>([])
  const [listsLoading, setListsLoading] = useState(true)

  // Chart data exactly representing the 8 weeks curve from the reference screenshot
  const trendData = [
    { week: "S1", alertes: 2, investigations: 0 },
    { week: "S2", alertes: 2, investigations: 0 },
    { week: "S3", alertes: 1, investigations: 1 },
    { week: "S4", alertes: 1, investigations: 1 },
    { week: "S5", alertes: 1, investigations: 1 },
    { week: "S6", alertes: 2, investigations: 2 },
    { week: "S7", alertes: 3.8, investigations: 2 },
    { week: "S8", alertes: 3.8, investigations: 2.9 },
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

  // Dynamic or fallback values matching reference screenshot
  const clientsCount = stats?.clients_filtres ? parseInt(stats.clients_filtres) : 5
  const alertesCount = stats?.alertes_actives ?? 3
  const alertesBloquantes = stats?.alertes_bloquantes ?? 2
  const investigationsCount = stats?.investigations_en_cours ?? 2
  const scoreMoyen = stats?.score_moyen ?? "32/100"

  return (
    <div className="space-y-5 pb-8">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. HERO BANNER DE BIENVENUE & INSTITUTIONNEL                      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(7,3,71,0.03)] dark:border-slate-800 dark:bg-slate-900">
        {/* Subtle decorative curved background lines (blue & red) */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-2/3 select-none opacity-40 dark:opacity-20">
          <svg
            viewBox="0 0 600 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full object-cover"
          >
            <path
              d="M100 -20 C 250 120, 350 40, 620 180"
              stroke="#070347"
              strokeWidth="1.5"
              strokeOpacity="0.15"
            />
            <path
              d="M140 -40 C 290 140, 380 60, 640 200"
              stroke="#070347"
              strokeWidth="1"
              strokeOpacity="0.1"
            />
            <path
              d="M200 -20 C 350 180, 480 30, 650 140"
              stroke="#CD0D29"
              strokeWidth="1.5"
              strokeOpacity="0.15"
            />
            <path
              d="M220 -40 C 370 200, 500 50, 670 160"
              stroke="#CD0D29"
              strokeWidth="1"
              strokeOpacity="0.08"
            />
            <circle cx="500" cy="90" r="140" stroke="#070347" strokeWidth="1" strokeOpacity="0.05" />
            <circle cx="500" cy="90" r="180" stroke="#070347" strokeWidth="0.8" strokeOpacity="0.04" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Welcome Text */}
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-[#070347] dark:text-slate-200">
              Bonjour {userName ? userName.split(" ")[0] : "Aminata"},
            </h2>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
              Voici le tableau de bord de votre conformité{" "}
              <span className="text-[#CD0D29]">LAKANA</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Surveillez, analysez et sécurisez vos opérations grâce à une vision globale et en temps réel.
            </p>
          </div>

          {/* Right Emblem + Slogan */}
          <div className="flex shrink-0 items-center gap-4 pr-2">
            {/* LAKANA Official Shield Graphic */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg viewBox="0 0 100 120" className="h-full w-full drop-shadow-md">
                {/* Outer Shield Border (Brand Red) */}
                <path
                  d="M50 4 L88 22 V58 C88 84 50 114 50 114 C50 114 12 84 12 58 V22 Z"
                  fill="#CD0D29"
                />
                {/* Inner Shield (Deep Navy) */}
                <path
                  d="M50 10 L82 25 V56 C82 79 50 106 50 106 C50 106 18 79 18 56 V25 Z"
                  fill="#070347"
                />
                {/* White / Silver Keyhole Emblem */}
                <circle cx="50" cy="46" r="11" fill="#FFFFFF" />
                <path
                  d="M44 48 L41 74 H59 L56 48 Z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>

            {/* Slogan Text */}
            <p className="max-w-[170px] text-xs font-semibold leading-snug text-[#070347] dark:text-slate-300">
              Plus de sécurité pour des opérations fiables et conformes.
            </p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1bis. ACTIONS RAPIDES                                              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("lakana-new-investigation"))}
          className="inline-flex items-center gap-2 rounded-xl bg-[#070347] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0a0563] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nouvelle investigation
        </button>
        <button
          onClick={() => navigateTo("Filtrage sanctions/PPE")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ShieldAlert className="h-4 w-4 text-[#CD0D29]" />
          Filtrage sanctions/PPE
        </button>
        <button
          onClick={() => navigateTo("Rapports réglementaires")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Download className="h-4 w-4 text-slate-500" />
          Exporter un rapport
        </button>
        <button
          onClick={() => {
            navigateTo("Intégration & Synchronisation")
            toast.success("Synchronisation lancée", { description: "Mise à jour de toutes les sources en cours." })
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
          Lancer une synchronisation
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. 4 CARTES KPI CLÉS AVEC SOULIGNEMENT COLORÉ                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* CARTE 1: Clients filtrés (Soulignement Bleu) */}
        <div
          onClick={() => navigateTo("Client 360°")}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 border-b-4 border-b-blue-600 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:border-b-blue-600 dark:bg-slate-900"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Clients filtrés
                </span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {clientsCount}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                ↑ +12%
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Score moyen : 32/100
          </p>
        </div>

        {/* CARTE 2: Alertes actives (Soulignement Rouge Officiel) */}
        <div
          onClick={() => navigateTo("Centre d'alertes")}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 border-b-4 border-b-[#CD0D29] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:border-b-[#CD0D29] dark:bg-slate-900"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#CD0D29] dark:bg-rose-950/50 dark:text-[#CD0D29]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alertes actives
                </span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {alertesCount}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-[#CD0D29] dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-400">
                ↑ +50%
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            <span className="font-bold text-[#CD0D29]">{alertesBloquantes}</span> bloquantes
          </p>
        </div>

        {/* CARTE 3: Investigations en cours (Soulignement Navy Officiel) */}
        <div
          onClick={() => navigateTo("Investigations")}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 border-b-4 border-b-[#070347] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:border-b-[#070347] dark:bg-slate-900"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#070347] dark:bg-indigo-950/50 dark:text-indigo-300">
                  <Search className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Investigations en cours
                </span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {investigationsCount}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                → 0%
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Dossiers ouverts
          </p>
        </div>

        {/* CARTE 4: Score moyen (Soulignement Vert Emeraude) */}
        <div
          onClick={() => navigateTo("Centre d'alertes")}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 border-b-4 border-b-emerald-500 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:border-b-emerald-500 dark:bg-slate-900"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Score moyen
                </span>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                {scoreMoyen}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                ↑ +8%
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            1 à analyser
          </p>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. GRAPHIQUE CENTRAL : 8 DERNIÈRES SEMAINES                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-[#070347] dark:bg-slate-800 dark:text-slate-200">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Activité de Surveillance : 8 dernières semaines
              </h3>
              <p className="text-xs text-slate-400">
                Évolution globale des signaux et dossiers d'investigation
              </p>
            </div>
          </div>

          {/* Legend Matching Reference Screenshot */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#070347]" />
              Alertes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              Investigations
            </span>
          </div>
        </div>

        <div className="mt-6 h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#070347" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#070347" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                domain={[0, 4]}
                ticks={[0, 1, 2, 3, 4]}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              />
              <Area
                type="monotone"
                dataKey="alertes"
                name="Alertes"
                stroke="#070347"
                strokeWidth={3}
                fill="url(#alertGrad)"
              />
              <Area
                type="monotone"
                dataKey="investigations"
                name="Investigations"
                stroke="#F59E0B"
                strokeWidth={2.5}
                fill="url(#invGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 4. DEUX COLONNES INFÉRIEURES : MODULES & CONFORMITÉ               */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* COLONNE GAUCHE : Activité par module de détection */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="h-5 w-5 text-[#070347] dark:text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Activité par module de détection
              </h3>
            </div>
            <button
              onClick={() => navigateTo("Centre d'alertes")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Voir tout →
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {/* Ligne 1 : Module FLT */}
            <div
              onClick={() => navigateTo("Centre d'alertes")}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3.5 transition-all hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Module FLT
                </span>
              </div>
              <div className="hidden sm:block">
                <Sparkline data={[2, 3, 2, 4, 3, 5, 4, 5]} color="#6366F1" />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">1</p>
                  <p className="text-[10px] text-slate-400">signaux</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </div>

            {/* Ligne 2 : PEP & Sanctions */}
            <div
              onClick={() => navigateTo("Filtrage sanctions/PPE")}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3.5 transition-all hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-[#CD0D29] dark:bg-rose-950/50 dark:text-[#CD0D29]">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  PEP & Sanctions
                </span>
              </div>
              <div className="hidden sm:block">
                <Sparkline data={[1, 1, 2, 2, 1, 2, 1, 1]} color="#CD0D29" />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">0</p>
                  <p className="text-[10px] text-slate-400">signaux</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </div>

            {/* Ligne 3 : Pays à haut risque */}
            <div
              onClick={() => navigateTo("Centre d'alertes")}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3.5 transition-all hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  <Globe className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Pays à haut risque
                </span>
              </div>
              <div className="hidden sm:block">
                <Sparkline data={[2, 2, 3, 2, 4, 3, 4, 4]} color="#F59E0B" />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">1</p>
                  <p className="text-[10px] text-slate-400">signaux</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </div>

            {/* Ligne 4 : Réseaux & Connexions */}
            <div
              onClick={() => navigateTo("Graphe de relations")}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3.5 transition-all hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Share2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Réseaux & Connexions
                </span>
              </div>
              <div className="hidden sm:block">
                <Sparkline data={[1, 2, 1, 3, 2, 4, 3, 5]} color="#2563EB" />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">2</p>
                  <p className="text-[10px] text-slate-400">signaux</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : État de conformité réglementaire */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-[#070347] dark:text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  État de conformité réglementaire
                </h3>
              </div>
              <button
                onClick={() => navigateTo("Rapports réglementaires")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Voir tout →
              </button>
            </div>

            {/* Bannière Verte : Listes sanctions à jour */}
            <div
              onClick={() => navigateTo("Filtrage sanctions/PPE")}
              className="mt-5 flex cursor-pointer items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 transition hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                  Listes sanctions à jour
                </span>
              </div>
              <span className="rounded-md bg-emerald-100/90 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                ONU · GAFI · CENTIF
              </span>
            </div>

            {/* Bannière Ambre : Investigations en cours */}
            <div
              onClick={() => navigateTo("Investigations")}
              className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 transition hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-amber-950 dark:text-amber-200">
                  Investigations en cours
                </span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:underline dark:text-amber-300">
                2 dossiers ouverts &gt;
              </span>
            </div>
          </div>

          {/* Mini grille inférieure en 3 colonnes */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            {/* Colonne 1 : Dernière mise à jour */}
            <div className="flex items-start gap-2.5">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Dernière mise à jour
                </p>
                <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  14 août 2026 – 08:42
                </p>
              </div>
            </div>

            {/* Colonne 2 : Conformité globale */}
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="w-full">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Conformité globale
                </p>
                <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  96%
                </p>
                <div className="mt-1 h-1.5 w-full max-w-[90px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: "96%" }} />
                </div>
              </div>
            </div>

            {/* Colonne 3 : Prochain contrôle */}
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Prochain contrôle
                </p>
                <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  28 août 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 5. ALERTES RÉCENTES & CLIENTS À RISQUE ÉLEVÉ                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* COLONNE GAUCHE : Alertes récentes */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BellRing className="h-5 w-5 text-[#070347] dark:text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Alertes récentes
              </h3>
            </div>
            <button
              onClick={() => navigateTo("Centre d'alertes")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Voir tout →
            </button>
          </div>

          <div className="mt-5">
            {listsLoading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : recentAlerts.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Aucune alerte récente"
                description="Les nouvelles alertes de conformité apparaîtront ici."
                variant="compact"
              />
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => navigateTo("Client 360°", { clientId: a.clientId })}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3.5 transition-all hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#CD0D29] dark:bg-rose-950/50 dark:text-[#CD0D29]">
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
                    <div className="flex shrink-0 items-center gap-3">
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

        {/* COLONNE DROITE : Clients à risque élevé */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserRound className="h-5 w-5 text-[#070347] dark:text-slate-300" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Clients à risque élevé
              </h3>
            </div>
            <button
              onClick={() => navigateTo("Client 360°")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Voir tout →
            </button>
          </div>

          <div className="mt-5">
            {listsLoading ? (
              <TableSkeleton rows={5} cols={3} />
            ) : topRiskClients.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="Aucun client à risque élevé"
                description="Les clients avec un score de risque élevé apparaîtront ici."
                variant="compact"
              />
            ) : (
              <div className="space-y-3">
                {topRiskClients.map((c) => {
                  const displayName =
                    c.typeClient === "Entreprise"
                      ? c.raisonSociale || c.nom
                      : `${c.nom} ${c.prenom || ""}`.trim()
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigateTo("Client 360°", { clientId: c.id })}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3.5 transition-all hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#070347] text-xs font-bold dark:bg-indigo-950/50 dark:text-indigo-300">
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
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#CD0D29] dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                          {c.riskScore}/100
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

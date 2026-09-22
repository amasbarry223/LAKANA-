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
  ArrowRightLeft,
  Wallet,
  CheckCircle2,
  Search,
  ShieldCheck,
  Send,
  Building2,
  Lock,
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from "recharts"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { statsService } from "@/services/statsService"
import { useDashboard } from "@/lib/dashboard-context"
import type { DashboardStats, ModuleStat, GuichetStats } from "@/models/stats"

type TrendPoint = { date: string; alertes: number; investigations: number }

export function OverviewView() {
  const { userRole, userName } = useDashboard()
  const isGuichet = userRole.toLowerCase().includes("guichet")

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [guichetStats, setGuichetStats] = useState<GuichetStats | null>(null)
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
      if (data.guichet_stats) setGuichetStats(data.guichet_stats)
    } catch (e) {
      console.error("Erreur chargement overview:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Cartes Analyste
  const analystCards = stats
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

  // Cartes Agent Guichet
  const guichetCards = guichetStats
    ? [
        {
          label: "Opérations contrôlées aujourd'hui",
          value: String(guichetStats.operations_du_jour),
          icon: ArrowRightLeft,
          color: "#10B981",
          delta: `${guichetStats.depots_count} dépôts · ${guichetStats.retraits_count} retraits`,
        },
        {
          label: "Opérations bloquées / interceptées",
          value: String(guichetStats.operations_bloquees),
          icon: ShieldAlert,
          color: "#EF4444",
          delta: "Pare-feu LAKANA actif",
        },
        {
          label: "Volume liquide traité",
          value: `${new Intl.NumberFormat("fr-FR").format(guichetStats.volume_traite_fcfa)} FCFA`,
          icon: Wallet,
          color: "#6366F1",
          delta: "Caisse du jour enregistrée",
        },
        {
          label: "Taux de conformité guichet",
          value: guichetStats.taux_conformite,
          icon: ShieldCheck,
          color: "#059669",
          delta: "Transactions sans rejet",
        },
      ]
    : [
        {
          label: "Opérations contrôlées aujourd'hui",
          value: "48",
          icon: ArrowRightLeft,
          color: "#10B981",
          delta: "32 dépôts · 16 retraits",
        },
        {
          label: "Opérations bloquées / interceptées",
          value: "2",
          icon: ShieldAlert,
          color: "#EF4444",
          delta: "Pare-feu LAKANA actif",
        },
        {
          label: "Volume liquide traité",
          value: "42 650 000 FCFA",
          icon: Wallet,
          color: "#6366F1",
          delta: "Caisse du jour enregistrée",
        },
        {
          label: "Taux de conformité guichet",
          value: "95.8%",
          icon: ShieldCheck,
          color: "#059669",
          delta: "Transactions sans rejet",
        },
      ]

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* EN-TÊTE DYNAMIQUE SELON LE RÔLE                                   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          {isGuichet ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Front-Office · Guichet & Caisse
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Pare-feu SQL actif sur Agence Centrale Bamako
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] dark:text-slate-100">
                Espace Guichet — Contrôle des Opérations
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Session active de <strong>{userName}</strong>. Toutes les transactions sont vérifiées automatiquement contre le fractionnement et les listes de sanctions.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  Direction de la Conformité · LBC/FT/FP
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Système {statutSysteme}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] dark:text-slate-100">
                Tableau de bord — Conformité LAKANA
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Vue de pilotage réglementaire pour l'analyste <strong>{userName}</strong> (Canevas CENTIF / BCEAO).
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ACTIONS RAPIDES POUR LE GUICHET                                   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {isGuichet && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            onClick={() => navigateTo("Transactions")}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 transition hover:bg-emerald-100/70 hover:shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">Saisir / Contrôler opération</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Dépôt, retrait ou transfert avec pare-feu</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-600 transition group-hover:translate-x-0.5" />
          </div>

          <div
            onClick={() => navigateTo("Filtrage sanctions/PPE")}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 transition hover:bg-indigo-100/70 hover:shadow-sm dark:border-indigo-900 dark:bg-indigo-950/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">Cribler un sociétaire</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-400">Vérification immédiate ONU · CENTIF</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-indigo-600 transition group-hover:translate-x-0.5" />
          </div>

          <div
            onClick={() => navigateTo("Clients & Enrôlement")}
            className="group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white shadow-sm dark:bg-slate-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Fiche Client & KYC</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Rechercher un compte ou sociétaire</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5" />
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* CARTES DE STATISTIQUES                                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse dark:border-slate-800 dark:bg-slate-900">
                <div className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-2 h-7 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="mt-1 h-3 w-24 rounded bg-slate-50 dark:bg-slate-800/50" />
              </div>
            ))
          : (isGuichet ? guichetCards : analystCards).map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${s.color}15` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{s.value}</p>
                <p className="mt-1 text-[11px] text-slate-400">{s.delta}</p>
              </div>
            ))}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION CENTRALE : GUICHET OU ANALYSTE                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {isGuichet ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* Graphique des flux horaires du guichet */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Activité de Caisse du Jour (Flux horaires)</h3>
                <p className="text-xs text-slate-400">Répartition des flux et détections automatiques du pare-feu</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Dépôts
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />Retraits
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Rejets LAKANA
                </span>
              </div>
            </div>
            <div className="mt-4 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={guichetStats?.hourly_flow || []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="heure" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  <Bar dataKey="depots" name="Dépôts" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="retraits" name="Retraits" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="suspects" name="Rejets pare-feu" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alertes d'interception récentes au guichet */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Interceptions au Guichet</h3>
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 text-xs">
                En direct
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mb-4">Derniers blocages automatiques effectués par le pare-feu</p>

            <div className="space-y-3">
              {(guichetStats?.recent_alerts || [
                {
                  reference: "ALR-FRC-329",
                  type: "Fractionnement",
                  client_nom: "Amadou Diallo",
                  niveau: "bloquante",
                  date: "14:15",
                },
                {
                  reference: "ALR-SNC-449",
                  type: "Sanctions ONU",
                  client_nom: "Moussa Traoré",
                  niveau: "bloquante",
                  date: "11:20",
                },
              ]).map((alr, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-xs dark:border-rose-950 dark:bg-rose-950/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-rose-900 dark:text-rose-200">{alr.reference}</span>
                    <span className="text-[10px] text-slate-400">{alr.date}</span>
                  </div>
                  <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">{alr.client_nom}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{alr.type}</span>
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                      Rejeté
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* VUE ANALYSTE DE CONFORMITÉ */
        <>
          {/* Trend 8 semaines */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Activité de Surveillance — 8 dernières semaines</h3>
                <p className="text-xs text-slate-400">Évolution globale des signaux et dossiers d'investigation</p>
              </div>
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
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Activité par module de détection</h3>
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
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">État de conformité réglementaire</h3>
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
                  onClick={() => navigateTo("Investigations")}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Investigations en cours</span>
                  </div>
                  <span className="text-xs font-semibold text-amber-700">
                    {loading ? "..." : `${stats?.investigations_en_cours ?? 0} dossiers ouverts`}
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
        </>
      )}
    </div>
  )
}


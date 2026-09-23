"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Search,
  RefreshCw,
  FolderSearch,
  User,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Archive,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { FilterBar } from "@/components/dashboard/filter-bar"
import { FunnelChartWidget } from "@/components/dashboard/funnel-chart"
import { TrendChartWidget } from "@/components/dashboard/trend-chart"
import { FunnelPerformance } from "@/components/dashboard/funnel-performance"
import { DropoffReasons } from "@/components/dashboard/dropoff-reasons"
import { FunnelInsights } from "@/components/dashboard/funnel-insights"
import { AlertDetailModal } from "@/components/dashboard/alert-detail-modal"
import { useDashboard, type AlertItem } from "@/lib/dashboard-context"
import { alertService } from "@/services/alertService"
import { navigateTo } from "@/lib/navigate"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Alert } from "@/models/alert"

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  nouvelle: { label: "Nouvelle", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: Clock },
  en_cours: { label: "En cours", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: AlertTriangle },
  cloturee: { label: "Clôturée", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  classee: { label: "Classée", bg: "bg-slate-100 border-slate-200", text: "text-slate-600", icon: Archive },
}

const LEVEL_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  bloquante: {
    label: "Bloquante",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
    icon: ShieldAlert,
  },
  analyser: {
    label: "À analyser",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 font-semibold",
    icon: AlertTriangle,
  },
  informative: {
    label: "Informative",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold",
    icon: Info,
  },
}

export function AlertsCenterView() {
  const { compareMode, alertsView, dateRangeLabel, filters, openNewInvestigation } = useDashboard()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AlertItem | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "bloquante" | "analyser" | "nouvelle">("all")

  // Chargement direct et dynamique des alertes depuis le backend
  const loadAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await alertService.getAlerts(filters)
      setAlerts(data)
    } catch (err) {
      console.error("Échec du chargement des alertes réelles :", err)
      toast.error("Impossible de charger les alertes depuis le serveur.")
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  // Modification dynamique du statut en base réelle
  const handleStatusChange = async (alert: Alert, newStatus: string) => {
    setUpdatingId(alert.id || alert.ref)
    try {
      await alertService.updateAlertStatus(alert.id || alert.ref, newStatus)
      toast.success(`Alerte ${alert.ref} : statut mis à jour en "${STATUS_CONFIG[newStatus]?.label || newStatus}"`)
      // Mise à jour optimiste de la liste locale
      setAlerts((prev) =>
        prev.map((a) => ((a.id && a.id === alert.id) || a.ref === alert.ref ? { ...a, status: newStatus as any } : a))
      )
    } catch (e) {
      toast.error(`Erreur lors de la mise à jour de l'alerte ${alert.ref}`)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtrage local supplémentaire par recherche textuelle & onglet rapide
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // Filtre d'onglet
      if (activeTab === "bloquante" && a.level !== "bloquante") return false
      if (activeTab === "analyser" && a.level !== "analyser") return false
      if (activeTab === "nouvelle" && a.status !== "nouvelle") return false

      // Recherche plein texte
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchRef = a.ref.toLowerCase().includes(q)
        const matchClient = a.client.toLowerCase().includes(q)
        const matchType = a.type.toLowerCase().includes(q)
        const matchModule = a.module.toLowerCase().includes(q)
        const matchAnalyste = a.analyste.toLowerCase().includes(q)
        const matchFacteurs = a.facteurs?.some((f) => f.toLowerCase().includes(q))
        if (!matchRef && !matchClient && !matchType && !matchModule && !matchAnalyste && !matchFacteurs) {
          return false
        }
      }

      return true
    })
  }, [alerts, activeTab, searchTerm])

  const counts = useMemo(() => {
    const total = alerts.length
    const bloquantes = alerts.filter((a) => a.level === "bloquante").length
    const analyser = alerts.filter((a) => a.level === "analyser").length
    const nouvelles = alerts.filter((a) => a.status === "nouvelle").length
    return { total, bloquantes, analyser, nouvelles }
  }, [alerts])

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
            Centre d'alertes de conformité
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Surveillance temps réel, priorisation et traitement des alertes LBC/FT/FP issues des moteurs réglementaires.
            <span className="ml-2 font-medium text-slate-600">· {dateRangeLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAlerts()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            title="Rafraîchir les alertes depuis le serveur"
          >
            <RefreshCw className={cn("h-4 w-4 text-slate-500", loading && "animate-spin text-indigo-600")} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {compareMode && (
        <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800">
          <span className="font-semibold">Mode comparaison actif</span>
          <span className="text-indigo-600">· Période précédente : alertes bloquantes -8%, score moyen -2 pts</span>
        </div>
      )}

      {/* Cartes Métriques (KPIs réels) */}
      <MetricCards />

      {/* Barre de filtres globale */}
      <FilterBar />

      {/* Section interactive : Tableau exhaustif & dynamique des alertes */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Barre d'outils du tableau : Onglets, Recherche et Compteurs */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                activeTab === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Toutes ({counts.total})
            </button>
            <button
              onClick={() => setActiveTab("bloquante")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                activeTab === "bloquante"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Bloquantes ({counts.bloquantes})
            </button>
            <button
              onClick={() => setActiveTab("analyser")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                activeTab === "analyser"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              À analyser ({counts.analyser})
            </button>
            <button
              onClick={() => setActiveTab("nouvelle")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                activeTab === "nouvelle"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Nouvelles ({counts.nouvelles})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher client, réf, motif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* Contenu : Tableau ou Grille */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm font-medium">Chargement des alertes en direct depuis l'API...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-800">Aucune alerte trouvée</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md">
              {searchTerm
                ? `Aucun résultat ne correspond à votre recherche "${searchTerm}".`
                : "Toutes les alertes pour ces filtres ont été traitées ou aucune anomalie n'a été levée."}
            </p>
            {(searchTerm || activeTab !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setActiveTab("all")
                }}
                className="mt-4 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Réinitialiser la recherche et les onglets
              </button>
            )}
          </div>
        ) : alertsView === "grid" ? (
          /* Affichage en cartes Grid */
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredAlerts.map((a) => {
              const levelConf = LEVEL_CONFIG[a.level] || LEVEL_CONFIG.analyser
              const LevelIcon = levelConf.icon
              const statusConf = STATUS_CONFIG[a.status] || STATUS_CONFIG.nouvelle

              return (
                <div
                  key={a.id || a.ref}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-indigo-300 hover:bg-white hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("border flex items-center gap-1", levelConf.badgeClass)}>
                          <LevelIcon className="h-3 w-3" />
                          {levelConf.label}
                        </Badge>
                        <span className="font-mono text-xs font-semibold text-slate-700">{a.ref}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">Score</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-xs font-bold",
                            a.score >= 75
                              ? "bg-rose-100 text-rose-800"
                              : a.score >= 50
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {a.score}/100
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4
                        onClick={() => navigateTo("Client 360°", { clientId: a.clientId })}
                        className="cursor-pointer font-semibold text-slate-900 transition hover:text-indigo-600 flex items-center gap-1.5"
                      >
                        <span>{a.client}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {a.type} • <span className="text-indigo-600 font-medium">{a.module}</span>
                      </p>
                    </div>

                    {/* Facteurs d'alerte réels */}
                    {a.facteurs && a.facteurs.length > 0 && (
                      <div className="rounded-lg bg-white p-2.5 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                        <p className="font-medium text-slate-700 text-[11px] uppercase tracking-wide">Motif d'alerte :</p>
                        <p className="line-clamp-2 italic">{a.facteurs[0]}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={a.status}
                        disabled={updatingId === (a.id || a.ref)}
                        onChange={(e) => handleStatusChange(a, e.target.value)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs font-medium cursor-pointer transition focus:outline-none",
                          statusConf.bg,
                          statusConf.text
                        )}
                      >
                        <option value="nouvelle">Nouvelle</option>
                        <option value="en_cours">En cours</option>
                        <option value="cloturee">Clôturée</option>
                        <option value="classee">Classée</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedAlertForModal(a)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => {
                          openNewInvestigation({
                            alertRef: a.ref,
                            client: a.client,
                            type: a.type,
                            score: a.score,
                          })
                          navigateTo("Investigations")
                        }}
                        className="flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
                      >
                        <FolderSearch className="h-3 w-3" />
                        Enquêter
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Affichage en Tableau Tabulaire Haute Densité */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 pl-4 pr-2">Niveau & Réf</th>
                  <th className="px-3 py-3.5">Client</th>
                  <th className="px-3 py-3.5">Type & Module</th>
                  <th className="px-3 py-3.5 text-center">Score</th>
                  <th className="px-3 py-3.5">Statut</th>
                  <th className="px-3 py-3.5">Analyste</th>
                  <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAlerts.map((a) => {
                  const levelConf = LEVEL_CONFIG[a.level] || LEVEL_CONFIG.analyser
                  const LevelIcon = levelConf.icon
                  const statusConf = STATUS_CONFIG[a.status] || STATUS_CONFIG.nouvelle

                  return (
                    <tr key={a.id || a.ref} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-4 pr-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("border flex items-center gap-1", levelConf.badgeClass)}>
                            <LevelIcon className="h-3 w-3" />
                            {levelConf.label}
                          </Badge>
                          <span className="font-mono text-xs font-semibold text-slate-900">{a.ref}</span>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div>
                          <button
                            onClick={() => navigateTo("Client 360°", { clientId: a.clientId })}
                            className="font-semibold text-slate-900 hover:text-indigo-600 transition flex items-center gap-1 text-left"
                          >
                            <span>{a.client}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </button>
                          {a.clientId && (
                            <span className="text-[11px] font-mono text-slate-400">ID: {a.clientId.slice(0, 8)}...</span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div>
                          <p className="font-medium text-slate-800">{a.type}</p>
                          <p className="text-xs text-indigo-600 font-medium">{a.module}</p>
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                            a.score >= 75
                              ? "bg-rose-100 text-rose-800"
                              : a.score >= 50
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {a.score}
                        </span>
                      </td>

                      <td className="px-3 py-3.5">
                        <select
                          value={a.status}
                          disabled={updatingId === (a.id || a.ref)}
                          onChange={(e) => handleStatusChange(a, e.target.value)}
                          className={cn(
                            "rounded-md border px-2.5 py-1 text-xs font-medium cursor-pointer transition focus:outline-none",
                            statusConf.bg,
                            statusConf.text
                          )}
                        >
                          <option value="nouvelle">Nouvelle</option>
                          <option value="en_cours">En cours</option>
                          <option value="cloturee">Clôturée</option>
                          <option value="classee">Classée</option>
                        </select>
                      </td>

                      <td className="px-3 py-3.5 text-xs text-slate-600">
                        {a.analyste || "Non assigné"}
                      </td>

                      <td className="py-3.5 pl-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAlertForModal(a)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                          >
                            Détail
                          </button>
                          <button
                            onClick={() => {
                              openNewInvestigation({
                                alertRef: a.ref,
                                client: a.client,
                                type: a.type,
                                score: a.score,
                              })
                              navigateTo("Investigations")
                            }}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
                          >
                            <FolderSearch className="h-3 w-3" />
                            Enquêter
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pied de tableau */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
          <span>
            Affichage de <strong className="text-slate-700">{filteredAlerts.length}</strong> alertes
            {filteredAlerts.length !== alerts.length && ` sur ${alerts.length} totales`}
          </span>
          <span className="font-mono text-[11px] text-slate-400">Source : API FastAPI / PostgreSQL & SQLite</span>
        </div>
      </div>

      {/* Widgets Analytiques & Funnel (pipeline et tendances de détection) */}
      <div data-alerts-widgets className="space-y-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FunnelChartWidget />
          </div>
          <div className="flex flex-col gap-5 xl:col-span-1">
            <FunnelPerformance />
            <DropoffReasons />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TrendChartWidget />
          </div>
          <div className="xl:col-span-1">
            <FunnelInsights />
          </div>
        </div>
      </div>

      {/* Modal de détail d'alerte avec facteurs dynamiques réels */}
      {selectedAlertForModal && (
        <AlertDetailModal
          alert={selectedAlertForModal}
          onClose={() => setSelectedAlertForModal(null)}
        />
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Search, Check, X, ArrowUp, ArrowDown, RefreshCw, UserCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn, formatFacteur } from "@/lib/utils"
import { alertService } from "@/services/alertService"
import { filteringService } from "@/services/filteringService"
import { DataPagination } from "@/components/ui/data-pagination"
import { usePaginatedFetch } from "@/hooks/use-pagination"
import { TableSkeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import type { SanctionMatch } from "@/models/sanction"
import type { Alert } from "@/models/alert"

type Match = {
  id: string
  alertId?: string
  client: string
  clientId: string
  listName: string
  listType: "ONU" | "GAFI" | "CENTIF" | "PPE"
  matchedEntry: string
  similarity: number
  status: "en_attente" | "confirme" | "rejete"
  date: string
}

const listBadge: Record<Match["listType"], string> = {
  ONU: "bg-slate-100 text-slate-600 border-slate-200",
  GAFI: "bg-slate-100 text-slate-600 border-slate-200",
  CENTIF: "bg-slate-100 text-slate-600 border-slate-200",
  PPE: "bg-amber-50 text-amber-700 border-amber-200",
}

const statusConfig: Record<Match["status"], { label: string; color: string }> = {
  en_attente: { label: "En attente de revue", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirme: { label: "Confirmée (Bloquante)", color: "bg-rose-50 text-rose-700 border-rose-200" },
  rejete: { label: "Faux positif rejeté", color: "bg-slate-100 text-slate-600 border-slate-200" },
}

const filters = ["Toutes", "En attente", "Confirmées", "Rejetées"] as const

// "En attente" regroupe deux statuts backend (nouvelle + en_cours) — le backend
// accepte une liste séparée par des virgules pour ce filtre.
const filterToStatut: Record<(typeof filters)[number], string | undefined> = {
  "Toutes": undefined,
  "En attente": "nouvelle,en_cours",
  "Confirmées": "cloturee",
  "Rejetées": "classee",
}

type SortDir = "asc" | "desc"

function SortIcon({ sortDir }: { sortDir: SortDir }) {
  const Icon: LucideIcon = sortDir === "asc" ? ArrowUp : ArrowDown
  return <Icon className="h-3 w-3" />
}

function mapAlertToMatch(a: Alert): Match {
  const premierFacteur = formatFacteur(a.facteurs?.[0])
  const simMatch = premierFacteur.match(/(\d+)%/)
  const sim = simMatch ? parseInt(simMatch[1], 10) : Math.max(75, a.score)
  const isPPE =
    (a.type || "").toLowerCase().includes("ppe") ||
    premierFacteur.toLowerCase().includes("ppe")
  const listType: Match["listType"] = isPPE ? "PPE" : "ONU"
  const mapStatus = (s: string): Match["status"] => {
    if (s === "cloturee") return "confirme"
    if (s === "classee") return "rejete"
    return "en_attente"
  }
  return {
    id: a.ref || `FLT-${a.id.slice(0, 6)}`,
    alertId: a.id,
    client: a.client,
    clientId: a.clientId || "CLI-1000",
    listName: isPPE ? "Liste PPE Mali (UEMOA)" : "Sanctions ONU / GAFI",
    listType,
    matchedEntry: premierFacteur || `${a.client} (${listType})`,
    similarity: sim,
    status: mapStatus(a.status),
    date: a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR"),
  }
}

export function SanctionsView() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Toutes")
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Testeur de nom RapidFuzz interactif en direct
  const [testNom, setTestNom] = useState("")
  const [testingFuzzy, setTestingFuzzy] = useState(false)
  const [testResults, setTestResults] = useState<SanctionMatch[] | null>(null)

  // Recherche différée de 300ms pour éviter une requête serveur à chaque frappe
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  // Correspondances sanctions/PPE — pagination réelle côté serveur, classification
  // appliquée en base (voir `classification=sanctions_ppe` sur GET /alerts)
  const {
    data: rawAlerts,
    total: matchesTotal,
    page: matchesPage,
    setPage: setMatchesPage,
    totalPages: matchesTotalPages,
    loading,
    error,
    refetch: refetchMatches,
  } = usePaginatedFetch<Alert>(
    ({ skip, limit }) =>
      alertService.getAlertsPage(
        undefined,
        { skip, limit },
        {
          classification: "sanctions_ppe",
          statut: filterToStatut[filter],
          q: debouncedQuery || undefined,
          order: sortDir,
        }
      ),
    [debouncedQuery, filter, sortDir],
    { pageSize: 10 }
  )
  const pagedMatches = rawAlerts.map(mapAlertToMatch)

  // Compteurs des statuts : portée = toutes les correspondances sanctions/PPE,
  // indépendante de l'onglet et de la page affichés
  const [counts, setCounts] = useState({ en_attente: 0, confirme: 0, rejete: 0 })
  useEffect(() => {
    let cancelled = false
    Promise.all([
      alertService.getAlertsPage(undefined, { skip: 0, limit: 1 }, { classification: "sanctions_ppe", statut: "nouvelle,en_cours" }),
      alertService.getAlertsPage(undefined, { skip: 0, limit: 1 }, { classification: "sanctions_ppe", statut: "cloturee" }),
      alertService.getAlertsPage(undefined, { skip: 0, limit: 1 }, { classification: "sanctions_ppe", statut: "classee" }),
    ]).then(([enAttente, confirme, rejete]) => {
      if (cancelled) return
      setCounts({ en_attente: enAttente.total, confirme: confirme.total, rejete: rejete.total })
    })
    return () => {
      cancelled = true
    }
  }, [pagedMatches])

  const handleTestFuzzy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testNom.trim()) return
    setTestingFuzzy(true)
    try {
      const results = await filteringService.verifyName(testNom.trim(), 70)
      setTestResults(results)
      if (results.length === 0) {
        toast.info("Aucune correspondance détectée", {
          description: `"${testNom.trim()}" ne correspond à aucune entrée sous le seuil 70%.`,
        })
      }
    } catch (err) {
      console.error("Erreur test fuzzy:", err)
      toast.error("Erreur de test RapidFuzz")
    } finally {
      setTestingFuzzy(false)
    }
  }

  const toggleDateSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"))

  const setStatus = async (id: string, status: Match["status"], alertId?: string) => {
    if (alertId) {
      const backendStatut = status === "confirme" ? "cloturee" : status === "rejete" ? "classee" : "en_cours"
      await alertService.updateAlertStatus(alertId, { statut: backendStatut }).catch(() => {})
      window.dispatchEvent(new CustomEvent("lakana-alert-updated"))
      refetchMatches()
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Filtrage sanctions & PPE</h1>
          <p className="mt-1 text-sm text-slate-500">
            Moteur RapidFuzz haute performance calibré sur l'onomastique ouest-africaine (Listes ONU, UEMOA, CENTIF).
          </p>
        </div>
        <button
          onClick={refetchMatches}
          disabled={loading}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
          title="Actualiser les correspondances"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-indigo-600")} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Vérification ponctuelle d'un tiers */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <form onSubmit={handleTestFuzzy} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-slate-800 shrink-0">
            <Search className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wide">Vérification immédiate :</span>
          </div>
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={testNom}
              onChange={(e) => setTestNom(e.target.value)}
              placeholder="Saisissez un nom ou une raison sociale à contrôler (ex: Traoré, Diarra)..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-indigo-400 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={testingFuzzy || !testNom.trim()}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#070347] px-4 text-xs font-semibold text-white hover:bg-[#0a0563] cursor-pointer disabled:opacity-50 shrink-0"
          >
            {testingFuzzy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
            <span>Contrôler</span>
          </button>
        </form>

        {testResults && testResults.length > 0 && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-2xs font-bold uppercase tracking-wide text-slate-500">
              Correspondances détectées sur les listes ({testResults.length}) :
            </p>
            <div className="divide-y divide-slate-200/60">
              {testResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{r.nom_liste}</span>
                    <span className="ml-2 text-slate-500">({r.liste_nom})</span>
                  </div>
                  <Badge variant="outline" className={cn("font-mono text-2xs", r.similarite >= 85 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                    Similarité : {r.similarite.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Correspondances en attente", value: counts.en_attente, color: "#D97706" },
          { label: "Confirmées (bloquantes)", value: counts.confirme, color: "#CD0D29" },
          { label: "Faux positifs rejetés", value: counts.rejete, color: "#98A3B9" },
          { label: "Bases synchronisées", value: "ONU · CENTIF · PPE", color: "#070347" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: typeof s.color === "string" ? s.color : "#070347" }} />
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
            <p className="mt-1.5 text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer parmi les correspondances générées..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer",
                filter === f ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Matches list */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Correspondances actives ({matchesTotal})</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDateSort}
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition cursor-pointer"
            >
              Date
              <SortIcon sortDir={sortDir} />
            </button>
          </div>
        </div>

        {error ? (
          <ErrorState
            error={error}
            onRetry={refetchMatches}
            title="Impossible de charger les correspondances"
            message="Le service de filtrage sanctions n'a pas pu récupérer les données depuis l'API."
            className="my-6"
          />
        ) : loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : pagedMatches.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={query || filter !== "Toutes" ? "Aucune correspondance trouvée" : "Aucune correspondance active"}
            description={
              query || filter !== "Toutes"
                ? "Aucune entrée ne correspond à vos critères de filtrage actuels."
                : "Toutes les correspondances ont été vérifiées ou aucune alerte de sanction n'est en cours."
            }
            actionLabel={query || filter !== "Toutes" ? "Réinitialiser les filtres" : undefined}
            onAction={
              query || filter !== "Toutes"
                ? () => {
                    setFilter("Toutes")
                    setQuery("")
                  }
                : undefined
            }
            className="py-12"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {pagedMatches.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50/60">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="min-w-[200px] flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{m.client}</p>
                    <Badge variant="outline" className={cn("border text-2xs", listBadge[m.listType])}>{m.listType}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{m.id} • {m.clientId} • {m.date}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Entrée : <span className="font-medium text-slate-700">{m.matchedEntry}</span> — {m.listName}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">Similarité</p>
                  <p className={cn(
                    "text-lg font-bold font-mono",
                    m.similarity >= 90 ? "text-rose-600" : m.similarity >= 75 ? "text-amber-600" : "text-slate-600"
                  )}>
                    {m.similarity}%
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("border text-xs", statusConfig[m.status].color)}>
                    {statusConfig[m.status].label}
                  </Badge>

                  {m.status === "en_attente" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setStatus(m.id, "confirme", m.alertId)
                          toast.error("Correspondance confirmée", { description: `${m.id} — ${m.client}. Mesure de gel requise.` })
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        title="Confirmer (Mesure de gel)"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setStatus(m.id, "rejete", m.alertId)
                          toast.success("Faux positif rejeté", { description: `${m.id} — ${m.client}. Rejet motivé consigné.` })
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
                        title="Rejeter faux positif"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {m.status !== "en_attente" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setStatus(m.id, "en_attente", m.alertId)
                        toast.info("Remise en attente", { description: `${m.id} — ${m.client}.` })
                      }}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      Réexaminer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {matchesTotal > 0 && (
        <DataPagination
          page={matchesPage}
          totalPages={matchesTotalPages}
          total={matchesTotal}
          pageSize={10}
          onPageChange={setMatchesPage}
          itemLabel="correspondances"
        />
      )}

      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2.5 text-xs text-indigo-700">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        <span>Règle UEMOA : Toute mesure de blocage ou gel exige une revue humaine préalable documentée.</span>
      </div>
    </div>
  )
}

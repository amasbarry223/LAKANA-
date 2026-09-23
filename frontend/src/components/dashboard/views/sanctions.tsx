"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Search, Check, X, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Sparkles, CheckCircle2, UserCheck } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { alertService } from "@/services/alertService"
import { filteringService } from "@/services/filteringService"
import { DataPagination } from "@/components/ui/data-pagination"
import { usePageSlice } from "@/hooks/use-pagination"
import type { SanctionMatch } from "@/models/sanction"

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

type SortColumn = "similarity" | "date"
type SortDir = "asc" | "desc"

function SortIcon({ column, sortBy, sortDir }: { column: SortColumn; sortBy: SortColumn | null; sortDir: SortDir }) {
  const Icon: LucideIcon = sortBy !== column ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown
  return <Icon className="h-3 w-3" />
}

export function SanctionsView() {
  const [items, setItems] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<(typeof filters)[number]>("Toutes")
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  // Testeur de nom RapidFuzz interactif en direct
  const [testNom, setTestNom] = useState("")
  const [testingFuzzy, setTestingFuzzy] = useState(false)
  const [testResults, setTestResults] = useState<SanctionMatch[] | null>(null)

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const alerts = await alertService.getAlerts()
      const fltAlerts = alerts.filter(
        (a) =>
          (a.module || "").toLowerCase().includes("sanction") ||
          (a.type || "").toLowerCase().includes("ppe") ||
          (a.type || "").toLowerCase().includes("sanction") ||
          (a.facteurs || []).some((f) => /sanction|ppe|liste/i.test(f))
      )

      const dynamicMatches: Match[] = fltAlerts.map((a) => {
        const simMatch = a.facteurs?.[0]?.match(/(\d+)%/)
        const sim = simMatch ? parseInt(simMatch[1], 10) : Math.max(75, a.score)
        const isPPE =
          (a.type || "").toLowerCase().includes("ppe") ||
          (a.facteurs?.[0] || "").toLowerCase().includes("ppe")
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
          matchedEntry: a.facteurs?.[0] || `${a.client} (${listType})`,
          similarity: sim,
          status: mapStatus(a.status),
          date: a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR"),
        }
      })

      setItems(dynamicMatches)
    } catch (e) {
      console.warn("Erreur chargement sanctions dynamiques:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

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

  const toggleSort = (col: SortColumn) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir("desc")
    }
  }

  const setStatus = async (id: string, status: Match["status"], alertId?: string) => {
    setItems((arr) => arr.map((m) => (m.id === id ? { ...m, status } : m)))
    if (alertId) {
      const backendStatut = status === "confirme" ? "cloturee" : status === "rejete" ? "classee" : "en_cours"
      await alertService.updateAlertStatus(alertId, { statut: backendStatut }).catch(() => {})
      window.dispatchEvent(new CustomEvent("lakana-alert-updated"))
    }
  }

  const filtered = items.filter((m) => {
    const statusOk =
      filter === "Toutes" ||
      (filter === "En attente" && m.status === "en_attente") ||
      (filter === "Confirmées" && m.status === "confirme") ||
      (filter === "Rejetées" && m.status === "rejete")
    const queryOk =
      !query ||
      m.client.toLowerCase().includes(query.toLowerCase()) ||
      m.matchedEntry.toLowerCase().includes(query.toLowerCase())
    return statusOk && queryOk
  })

  const sorted = [...filtered].sort((a, b) => {
    if (!sortBy) return 0
    const dir = sortDir === "asc" ? 1 : -1
    if (sortBy === "similarity") return (a.similarity - b.similarity) * dir
    return a.date.localeCompare(b.date) * dir
  })

  const {
    data: pagedMatches,
    page: matchesPage,
    setPage: setMatchesPage,
    totalPages: matchesTotalPages,
    total: matchesTotal,
  } = usePageSlice(sorted, 10)

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
          onClick={fetchMatches}
          disabled={loading}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
          title="Actualiser les correspondances"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-indigo-600")} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Testeur Rapide RapidFuzz (Direct API) */}
      <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 to-white p-4 shadow-xs">
        <form onSubmit={handleTestFuzzy} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-indigo-900 shrink-0">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wide">Testeur Rapide RapidFuzz :</span>
          </div>
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={testNom}
              onChange={(e) => setTestNom(e.target.value)}
              placeholder="Saisissez un nom à tester en direct contre les listes (ex: Traoré, Diarra, Keïta)..."
              className="h-9 w-full rounded-lg border border-indigo-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>
          <button
            type="submit"
            disabled={testingFuzzy || !testNom.trim()}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {testingFuzzy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
            <span>Vérifier</span>
          </button>
        </form>

        {testResults && testResults.length > 0 && (
          <div className="mt-3 rounded-lg border border-indigo-200 bg-white p-3 space-y-2">
            <p className="text-2xs font-bold uppercase tracking-wide text-slate-500">
              Résultats de comparaison RapidFuzz ({testResults.length}) :
            </p>
            <div className="divide-y divide-slate-100">
              {testResults.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{r.nom_liste}</span>
                    <span className="ml-2 text-slate-400">({r.liste_nom})</span>
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
          { label: "Correspondances en attente", value: items.filter((m) => m.status === "en_attente").length, color: "#F59E0B" },
          { label: "Confirmées (bloquantes)", value: items.filter((m) => m.status === "confirme").length, color: "#EF4444" },
          { label: "Faux positifs rejetés", value: items.filter((m) => m.status === "rejete").length, color: "#64748B" },
          { label: "Bases synchronisées", value: "ONU · CENTIF · PPE", color: "#6366F1" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: typeof s.color === "string" ? s.color : "#6366F1" }} />
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
          <h3 className="text-sm font-semibold text-slate-900">Correspondances actives ({sorted.length})</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleSort("date")}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition cursor-pointer",
                sortBy === "date" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Date
              <SortIcon column="date" sortBy={sortBy} sortDir={sortDir} />
            </button>
            <button
              onClick={() => toggleSort("similarity")}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition cursor-pointer",
                sortBy === "similarity" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Similarité
              <SortIcon column="similarity" sortBy={sortBy} sortDir={sortDir} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Chargement des correspondances...</div>
        ) : pagedMatches.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">Aucune correspondance ne correspond aux filtres.</div>
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

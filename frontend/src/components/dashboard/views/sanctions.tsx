"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Search, Check, X, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Match = {
  id: string
  client: string
  clientId: string
  listName: string
  listType: "ONU" | "GAFI" | "CENTIF" | "PPE"
  matchedEntry: string
  similarity: number
  status: "en_attente" | "confirme" | "rejete"
  date: string
}

const matches: Match[] = [
  { id: "FLT-241", client: "Diarra, Fatoumata", clientId: "CLI-1087", listName: "Liste PPE Mali", listType: "PPE", matchedEntry: "Diarra Fatoumata (Conseiller ministériel)", similarity: 96, status: "en_attente", date: "24/08/2026" },
  { id: "FLT-240", client: "Traoré, Moussa", clientId: "CLI-1042", listName: "Sanctions ONU", listType: "ONU", matchedEntry: "Moussa Traoré (variant orth.)", similarity: 88, status: "en_attente", date: "24/08/2026" },
  { id: "FLT-239", client: "Sangaré, Oumar", clientId: "CLI-1098", listName: "Sanctions GAFI", listType: "GAFI", matchedEntry: "Oumar Sangare (variant phon.)", similarity: 91, status: "en_attente", date: "23/08/2026" },
  { id: "FLT-235", client: "Coulibaly, Boubacar", clientId: "CLI-1066", listName: "CENTIF-Mali", listType: "CENTIF", matchedEntry: "B. Coulibary", similarity: 74, status: "rejete", date: "22/08/2026" },
  { id: "FLT-230", client: "Keïta, Ibrahim", clientId: "CLI-1103", listName: "Liste PPE Mali", listType: "PPE", matchedEntry: "Ibrahim Keita (homonyme)", similarity: 82, status: "rejete", date: "20/08/2026" },
  { id: "FLT-225", client: "Touré, Awa", clientId: "CLI-1055", listName: "Sanctions ONU", listType: "ONU", matchedEntry: "Awa Touré", similarity: 99, status: "confirme", date: "18/08/2026" },
  { id: "FLT-220", client: "Diallo, Modibo", clientId: "CLI-1090", listName: "Sanctions GAFI", listType: "GAFI", matchedEntry: "Modibo D.", similarity: 68, status: "rejete", date: "15/08/2026" },
]

const listBadge: Record<Match["listType"], string> = {
  ONU: "bg-blue-50 text-blue-700 border-blue-200",
  GAFI: "bg-violet-50 text-violet-700 border-violet-200",
  CENTIF: "bg-amber-50 text-amber-700 border-amber-200",
  PPE: "bg-cyan-50 text-cyan-700 border-cyan-200",
}

const statusConfig: Record<Match["status"], { label: string; color: string }> = {
  en_attente: { label: "En attente de revue", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirme: { label: "Confirmée", color: "bg-rose-50 text-rose-700 border-rose-200" },
  rejete: { label: "Faux positif rejeté", color: "bg-slate-100 text-slate-600 border-slate-200" },
}

const filters = ["Toutes", "En attente", "Confirmées", "Rejetées"] as const

type SortColumn = "similarity" | "date"
type SortDir = "asc" | "desc"

function SortIcon({ column, sortBy, sortDir }: { column: SortColumn; sortBy: SortColumn | null; sortDir: SortDir }) {
  const Icon: LucideIcon = sortBy !== column ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown
  return <Icon className="h-3 w-3" />
}

import { RefreshCw } from "lucide-react"
import { alertService } from "@/services/alertService"

export function SanctionsView() {
  const [items, setItems] = useState<Match[]>(matches)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<(typeof filters)[number]>("Toutes")
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

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
      if (fltAlerts.length > 0) {
        const dynamicMatches: Match[] = fltAlerts.map((a) => {
          const simMatch = a.facteurs?.[0]?.match(/(\d+)%/)
          const sim = simMatch ? parseInt(simMatch[1], 10) : Math.max(70, a.score)
          const isPPE = (a.type || "").toLowerCase().includes("ppe") || (a.facteurs?.[0] || "").toLowerCase().includes("ppe")
          const listType: Match["listType"] = isPPE ? "PPE" : "ONU"
          const mapStatus = (s: string): Match["status"] => {
            if (s === "cloturee") return "confirme"
            if (s === "classee") return "rejete"
            return "en_attente"
          }
          return {
            id: a.ref || `FLT-${a.id.slice(0, 6)}`,
            client: a.client,
            clientId: a.clientId || "CLI-1000",
            listName: isPPE ? "Liste PPE Mali" : "Sanctions ONU",
            listType,
            matchedEntry: a.facteurs?.[0] || `${a.client} (${listType})`,
            similarity: sim,
            status: mapStatus(a.status),
            date: new Date().toLocaleDateString("fr-FR"),
          }
        })
        // Fusionner avec les données de référence en évitant les doublons
        const existingIds = new Set(dynamicMatches.map((m) => m.client))
        const remaining = matches.filter((m) => !existingIds.has(m.client))
        setItems([...dynamicMatches, ...remaining])
      }
    } catch (e) {
      console.warn("Erreur chargement sanctions dynamiques:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  // Escape key closes the detail modal
  useEffect(() => {
    if (!selectedMatch) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedMatch(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedMatch])

  const toggleSort = (col: SortColumn) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir("desc")
    }
  }

  const setStatus = (id: string, status: Match["status"]) => {
    setItems((arr) => arr.map((m) => (m.id === id ? { ...m, status } : m)))
    setSelectedMatch((m) => (m?.id === id ? { ...m, status } : m))
  }

  const filtered = items.filter((m) => {
    const statusOk =
      filter === "Toutes" ||
      (filter === "En attente" && m.status === "en_attente") ||
      (filter === "Confirmées" && m.status === "confirme") ||
      (filter === "Rejetées" && m.status === "rejete")
    const queryOk = !query || m.client.toLowerCase().includes(query.toLowerCase()) || m.matchedEntry.toLowerCase().includes(query.toLowerCase())
    return statusOk && queryOk
  })

  const sorted = [...filtered].sort((a, b) => {
    if (!sortBy) return 0
    const dir = sortDir === "asc" ? 1 : -1
    if (sortBy === "similarity") return (a.similarity - b.similarity) * dir
    return a.date.localeCompare(b.date) * dir
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Filtrage sanctions & PPE</h1>
          <p className="mt-1 text-sm text-slate-500">Correspondances par fuzzy matching calibré noms ouest-africains (FLT-01/02).</p>
        </div>
        <button
          onClick={fetchMatches}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
          title="Actualiser les correspondances"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Correspondances en attente", value: items.filter((m) => m.status === "en_attente").length, color: "#F59E0B" },
          { label: "Confirmées (bloquantes)", value: items.filter((m) => m.status === "confirme").length, color: "#EF4444" },
          { label: "Faux positifs rejetés", value: items.filter((m) => m.status === "rejete").length, color: "#64748B" },
          { label: "Listes actives", value: 4, color: "#6366F1" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <p className="text-[13px] font-medium text-slate-500">{s.label}</p>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
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
            placeholder="Rechercher client ou entrée de liste..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                filter === f ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Matches list */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Correspondances ({sorted.length})</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleSort("date")}
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition cursor-pointer",
                sortBy === "date" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Date
              <SortIcon column="date" sortBy={sortBy} sortDir={sortDir} />
            </button>
            <button
              onClick={() => toggleSort("similarity")}
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide transition cursor-pointer",
                sortBy === "similarity" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Similarité
              <SortIcon column="similarity" sortBy={sortBy} sortDir={sortDir} />
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {sorted.map((m) => (
            <div key={m.id} onClick={() => setSelectedMatch(m)} className="flex cursor-pointer flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <ShieldAlert className="h-5 w-5 text-slate-500" />
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{m.client}</p>
                  <Badge variant="outline" className={cn("border", listBadge[m.listType])}>{m.listType}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{m.id} • {m.clientId} • {m.date}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Entrée : <span className="font-medium text-slate-700">{m.matchedEntry}</span> : {m.listName}
                </p>
              </div>
              {/* Similarity */}
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Similarité</p>
                <p className={cn(
                  "text-lg font-bold",
                  m.similarity >= 90 ? "text-rose-600" : m.similarity >= 75 ? "text-amber-600" : "text-slate-600"
                )}>
                  {m.similarity}%
                </p>
              </div>
              {/* Status + actions */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("border", statusConfig[m.status].color)}>
                  {statusConfig[m.status].label}
                </Badge>
                {m.status === "en_attente" && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setStatus(m.id, "confirme")
                        toast.error("Correspondance confirmée", { description: `${m.id} : ${m.client}. Mesure de gel requise (FLT-04).` })
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                      title="Confirmer (FLT-04)"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setStatus(m.id, "rejete")
                        toast.success("Faux positif rejeté", { description: `${m.id} : ${m.client}. Rejet motivé (FLT-05).` })
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                      title="Rejeter faux positif (FLT-05)"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {m.status !== "en_attente" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setStatus(m.id, "en_attente")
                      toast.info("Correspondance remise en attente", { description: `${m.id} : ${m.client}.` })
                    }}
                    className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2.5 text-xs text-indigo-700">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        <span>Toute mesure de gel exige une revue humaine préalable (FLT-04). Le filtrage est relancé automatiquement après chaque mise à jour des listes (FLT-06).</span>
      </div>

      {/* Match detail modal */}
      {selectedMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Correspondance {selectedMatch.id}</h3>
                <p className="mt-0.5 text-xs text-slate-400">{selectedMatch.client} : {selectedMatch.clientId}</p>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Client info */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Client</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedMatch.client}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Date</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedMatch.date}</p>
              </div>
            </div>

            {/* Match details */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <span className="text-xs text-slate-500">Liste</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{selectedMatch.listName}</span>
                  <Badge variant="outline" className={cn("border", listBadge[selectedMatch.listType])}>{selectedMatch.listType}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <span className="text-xs text-slate-500">Entrée matchée</span>
                <span className="text-sm font-semibold text-slate-900">{selectedMatch.matchedEntry}</span>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Similarité</span>
                  <span className={cn(
                    "text-sm font-bold",
                    selectedMatch.similarity >= 90 ? "text-rose-600" : selectedMatch.similarity >= 75 ? "text-amber-600" : "text-slate-600"
                  )}>
                    {selectedMatch.similarity}%
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      selectedMatch.similarity >= 90 ? "bg-rose-500" : selectedMatch.similarity >= 75 ? "bg-amber-500" : "bg-slate-400"
                    )}
                    style={{ width: `${selectedMatch.similarity}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <span className="text-xs text-slate-500">Statut</span>
                <Badge variant="outline" className={cn("border", statusConfig[selectedMatch.status].color)}>
                  {statusConfig[selectedMatch.status].label}
                </Badge>
              </div>
            </div>

            {/* Action area */}
            <div className="mt-5">
              {selectedMatch.status === "en_attente" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStatus(selectedMatch.id, "confirme")
                      toast.error("Correspondance confirmée", { description: `${selectedMatch.id} : ${selectedMatch.client}. Mesure de gel requise (FLT-04).` })
                      setSelectedMatch(null)
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    <Check className="h-4 w-4" />
                    Confirmer
                  </button>
                  <button
                    onClick={() => {
                      setStatus(selectedMatch.id, "rejete")
                      toast.success("Faux positif rejeté", { description: `${selectedMatch.id} : ${selectedMatch.client}. Rejet motivé (FLT-05).` })
                      setSelectedMatch(null)
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                    Rejeter
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <span className="font-medium">Décision enregistrée :</span>{" "}
                    {selectedMatch.status === "confirme"
                      ? "correspondance confirmée : mesure de gel appliquée."
                      : "faux positif rejeté et motivé."}
                  </div>
                  <button
                    onClick={() => {
                      setStatus(selectedMatch.id, "en_attente")
                      toast.info("Correspondance remise en attente", { description: `${selectedMatch.id} : ${selectedMatch.client}.` })
                      setSelectedMatch(null)
                    }}
                    className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Réinitialiser
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

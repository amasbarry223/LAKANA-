"use client"

import { useState } from "react"
import { ShieldAlert, Search, Check, X, ChevronDown } from "lucide-react"
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

export function SanctionsView() {
  const [items, setItems] = useState<Match[]>(matches)
  const [filter, setFilter] = useState<(typeof filters)[number]>("Toutes")
  const [query, setQuery] = useState("")

  const setStatus = (id: string, status: Match["status"]) => {
    setItems((arr) => arr.map((m) => (m.id === id ? { ...m, status } : m)))
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Filtrage sanctions & PPE</h1>
        <p className="mt-1 text-sm text-slate-500">Correspondances par fuzzy matching calibré noms ouest-africains (FLT-01/02).</p>
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
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Correspondances ({filtered.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50">
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
                  Entrée : <span className="font-medium text-slate-700">{m.matchedEntry}</span> — {m.listName}
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
                      onClick={() => {
                        setStatus(m.id, "confirme")
                        toast.error("Correspondance confirmée", { description: `${m.id} — ${m.client}. Mesure de gel requise (FLT-04).` })
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                      title="Confirmer (FLT-04)"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setStatus(m.id, "rejete")
                        toast.success("Faux positif rejeté", { description: `${m.id} — ${m.client}. Rejet motivé (FLT-05).` })
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
                    onClick={() => {
                      setStatus(m.id, "en_attente")
                      toast.info("Correspondance remise en attente", { description: `${m.id} — ${m.client}.` })
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
    </div>
  )
}

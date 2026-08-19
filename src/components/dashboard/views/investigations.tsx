"use client"

import { useState } from "react"
import {
  FolderSearch,
  ChevronRight,
  FileText,
  Paperclip,
  Clock,
  CheckCircle2,
  Send,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Status = "en_cours" | "cloturee" | "transmise"

type Investigation = {
  ref: string
  client: string
  alertRef: string
  type: string
  analyste: string
  status: Status
  dateOuverture: string
  dateCloture?: string
  decision?: string
  notes: number
  pieces: number
  score: number
}

const investigations: Investigation[] = [
  {
    ref: "INV-241",
    client: "Traoré, Moussa",
    alertRef: "ALR-241",
    type: "Fractionnement",
    analyste: "A. Touré",
    status: "en_cours",
    dateOuverture: "25/08/2026",
    notes: 4,
    pieces: 2,
    score: 87,
  },
  {
    ref: "INV-238",
    client: "Diarra, Fatoumata",
    alertRef: "ALR-238",
    type: "Correspondance PPE",
    analyste: "A. Touré",
    status: "en_cours",
    dateOuverture: "24/08/2026",
    notes: 2,
    pieces: 1,
    score: 72,
  },
  {
    ref: "INV-235",
    client: "Keïta, Ibrahim",
    alertRef: "ALR-235",
    type: "Volume inhabituel",
    analyste: "M. Diallo",
    status: "en_cours",
    dateOuverture: "23/08/2026",
    notes: 1,
    pieces: 0,
    score: 64,
  },
  {
    ref: "INV-229",
    client: "Coulibaly, Aïssata",
    alertRef: "ALR-229",
    type: "Fréquence anormale",
    analyste: "A. Touré",
    status: "cloturee",
    dateOuverture: "20/08/2026",
    dateCloture: "22/08/2026",
    decision: "Classée sans suite — activité justifiée",
    notes: 5,
    pieces: 3,
    score: 58,
  },
  {
    ref: "INV-219",
    client: "Touré, Seydou",
    alertRef: "ALR-219",
    type: "Relations inhabituelles",
    analyste: "M. Diallo",
    status: "transmise",
    dateOuverture: "15/08/2026",
    dateCloture: "21/08/2026",
    decision: "Déclaration de soupçon transmise au CENTIF",
    notes: 7,
    pieces: 5,
    score: 81,
  },
  {
    ref: "INV-156",
    client: "Sangaré, Mariam",
    alertRef: "ALR-156",
    type: "Comportement atypique",
    analyste: "A. Touré",
    status: "cloturee",
    dateOuverture: "02/08/2026",
    dateCloture: "10/08/2026",
    decision: "Classée — faux positif documenté",
    notes: 3,
    pieces: 1,
    score: 36,
  },
]

const statusConfig: Record<Status, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  en_cours: { label: "En cours", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  cloturee: { label: "Classée", color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle2 },
  transmise: { label: "Transmise", color: "bg-rose-50 text-rose-700 border-rose-200", icon: Send },
}

const filters: { key: Status | "toutes"; label: string }[] = [
  { key: "toutes", label: "Toutes" },
  { key: "en_cours", label: "En cours" },
  { key: "cloturee", label: "Classées" },
  { key: "transmise", label: "Transmises" },
]

export function InvestigationsView() {
  const [filter, setFilter] = useState<Status | "toutes">("toutes")
  const [selected, setSelected] = useState<string | null>("INV-241")

  const filtered = investigations.filter((i) => filter === "toutes" || i.status === filter)
  const selectedInv = investigations.find((i) => i.ref === selected) || filtered[0]

  const counts = {
    toutes: investigations.length,
    en_cours: investigations.filter((i) => i.status === "en_cours").length,
    cloturee: investigations.filter((i) => i.status === "cloturee").length,
    transmise: investigations.filter((i) => i.status === "transmise").length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
          Investigations
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Dossiers d'investigation — traçabilité complète (INV-04).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total dossiers", value: investigations.length, color: "#6366F1" },
          { label: "En cours", value: counts.en_cours, color: "#F59E0B" },
          { label: "Classées", value: counts.cloturee, color: "#64748B" },
          { label: "Transmises CENTIF", value: counts.transmise, color: "#EF4444" },
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

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
              filter === f.key
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {f.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              filter === f.key ? "bg-indigo-200 text-indigo-700" : "bg-slate-100 text-slate-500"
            )}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* List + detail */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* List */}
        <div className="rounded-xl border border-slate-200 bg-white xl:col-span-2">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Dossiers ({filtered.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((inv) => {
              const sc = statusConfig[inv.status]
              const Icon = sc.icon
              const isSelected = selectedInv?.ref === inv.ref
              return (
                <button
                  key={inv.ref}
                  onClick={() => setSelected(inv.ref)}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-3.5 text-left transition",
                    isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <FolderSearch className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{inv.client}</p>
                      <Badge variant="outline" className={cn("border gap-1", sc.color)}>
                        <Icon className="h-2.5 w-2.5" />
                        {sc.label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {inv.ref} • {inv.type} • {inv.alertRef}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-slate-900">{inv.score}/100</p>
                    <p className="text-[11px] text-slate-400">{inv.dateOuverture}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selectedInv && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Détail du dossier</h3>
              <Badge variant="outline" className="border-slate-200 text-slate-500">
                {selectedInv.ref}
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Client</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedInv.client}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Alerte</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedInv.alertRef}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedInv.type}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Score</p>
                  <p className="mt-0.5 text-sm font-semibold text-indigo-600">{selectedInv.score}/100</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Analyste</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedInv.analyste}</p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Ouverture</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedInv.dateOuverture}</p>
                {selectedInv.dateCloture && (
                  <>
                    <p className="mt-2 text-xs text-slate-400">Clôture</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedInv.dateCloture}</p>
                  </>
                )}
              </div>

              {selectedInv.decision && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-medium text-slate-400">Décision motivée</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedInv.decision}</p>
                </div>
              )}

              {/* Notes & pieces */}
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{selectedInv.notes} notes</span>
                </div>
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <Paperclip className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{selectedInv.pieces} pièces</span>
                </div>
              </div>

              {selectedInv.status === "en_cours" ? (
                <button className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
                  Documenter une décision
                </button>
              ) : (
                <button className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                  <User className="h-3.5 w-3.5" />
                  Rouvrir le dossier (responsable)
                </button>
              )}

              <p className="text-center text-[11px] text-slate-400">
                Traçabilité : auteur, date et décision enregistrés (INV-04)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

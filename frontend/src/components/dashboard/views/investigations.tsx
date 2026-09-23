"use client"

import { useState, useEffect } from "react"
import {
  FolderSearch,
  ChevronRight,
  FileText,
  Paperclip,
  Clock,
  CheckCircle2,
  Send,
  User,
  X,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useDashboard, type InvestigationStatus, type Investigation } from "@/lib/dashboard-context"
import { investigationService } from "@/services/investigationService"
import { DataPagination } from "@/components/ui/data-pagination"
import { usePaginatedFetch } from "@/hooks/use-pagination"

const statusConfig: Record<InvestigationStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  en_cours: { label: "En cours", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  cloturee: { label: "Classée", color: "bg-slate-100 text-slate-600 border-slate-200", icon: CheckCircle2 },
  transmise: { label: "Transmise", color: "bg-rose-50 text-rose-700 border-rose-200", icon: Send },
}

const filters: { key: InvestigationStatus | "toutes"; label: string }[] = [
  { key: "toutes", label: "Toutes" },
  { key: "en_cours", label: "En cours" },
  { key: "cloturee", label: "Classées" },
  { key: "transmise", label: "Transmises" },
]

export function InvestigationsView() {
  const { investigations, setInvestigations, selectedInvestigationRef, setSelectedInvestigationRef, openNewInvestigation } = useDashboard()
  const [filter, setFilter] = useState<InvestigationStatus | "toutes">("toutes")
  const [selected, setSelected] = useState<string | null>(null)
  const [decisionOpen, setDecisionOpen] = useState(false)
  const [decisionText, setDecisionText] = useState("")
  const [decisionType, setDecisionType] = useState<InvestigationStatus>("cloturee")
  const [submitting, setSubmitting] = useState(false)

  // Liste paginée côté serveur (source de vérité pour le tableau de dossiers)
  const {
    data: pagedInvestigations,
    total: totalFiltered,
    page,
    setPage,
    totalPages,
    loading,
    refetch: refetchInvestigations,
  } = usePaginatedFetch<Investigation>(
    ({ skip, limit }) => investigationService.getInvestigationsPage(filter === "toutes" ? undefined : filter, { skip, limit }),
    [filter],
    { pageSize: 20 }
  )

  // Compteurs des onglets : portée = tous statuts, indépendante de la page affichée
  const [counts, setCounts] = useState({ toutes: 0, en_cours: 0, cloturee: 0, transmise: 0 })
  useEffect(() => {
    let cancelled = false
    Promise.all([
      investigationService.getInvestigationsPage(undefined, { skip: 0, limit: 1 }),
      investigationService.getInvestigationsPage("en_cours", { skip: 0, limit: 1 }),
      investigationService.getInvestigationsPage("cloturee", { skip: 0, limit: 1 }),
      investigationService.getInvestigationsPage("transmise", { skip: 0, limit: 1 }),
    ]).then(([toutes, en_cours, cloturee, transmise]) => {
      if (cancelled) return
      setCounts({ toutes: toutes.total, en_cours: en_cours.total, cloturee: cloturee.total, transmise: transmise.total })
    })
    return () => {
      cancelled = true
    }
  }, [pagedInvestigations])

  useEffect(() => {
    if (selectedInvestigationRef) {
      setSelected(selectedInvestigationRef)
      setSelectedInvestigationRef(null)
    }
  }, [selectedInvestigationRef, setSelectedInvestigationRef])

  useEffect(() => {
    if (!selected && pagedInvestigations.length > 0) {
      setSelected(pagedInvestigations[0].ref)
    }
  }, [pagedInvestigations, selected])

  // Le dossier sélectionné peut être hors de la page courante (deep-link, dossier
  // fraîchement créé) : on cherche d'abord dans la page affichée, puis dans le
  // cache global du contexte (qui contient aussi les créations optimistes).
  const selectedInv =
    pagedInvestigations.find((i) => i.ref === selected) ||
    investigations.find((i) => i.ref === selected) ||
    pagedInvestigations[0]

  const submitDecision = async () => {
    if (!decisionText.trim()) {
      toast.error("Décision requise", { description: "Veuillez documenter la décision motivée." })
      return
    }
    if (!selectedInv) return

    if (decisionType === "en_cours") {
      // "Maintenir en cours" ne clôture rien côté backend — simple annotation locale.
      setDecisionText("")
      setDecisionOpen(false)
      toast.info("Dossier maintenu en cours", { description: `${selectedInv.ref} reste actif.` })
      return
    }

    setSubmitting(true)
    try {
      await investigationService.closeInvestigation(selectedInv.ref, { status: decisionType, decision: decisionText })
      const today = new Date().toLocaleDateString("fr-FR")
      setInvestigations((arr) =>
        arr.map((i) =>
          i.ref === selectedInv.ref
            ? { ...i, status: decisionType, decision: decisionText, dateCloture: today }
            : i
        )
      )
      refetchInvestigations()
      const label = decisionType === "transmise" ? "Déclaration transmise au CENTIF" : "Investigation clôturée"
      toast.success(label, { description: `${selectedInv.ref} — ${selectedInv.client}. Décision tracée.` })
      setDecisionText("")
      setDecisionOpen(false)
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement de la décision", { description: "Veuillez réessayer." })
    } finally {
      setSubmitting(false)
    }
  }

  const reopenInvestigation = async () => {
    if (!selectedInv) return
    setSubmitting(true)
    try {
      await investigationService.reopenInvestigation(selectedInv.ref)
      setInvestigations((arr) =>
        arr.map((i) =>
          i.ref === selectedInv.ref ? { ...i, status: "en_cours", decision: undefined, dateCloture: undefined } : i
        )
      )
      refetchInvestigations()
      toast.info("Dossier rouvert", { description: `${selectedInv.ref} — réouverture motivée par le responsable.` })
    } catch (e) {
      toast.error("Erreur lors de la réouverture du dossier", { description: "Veuillez réessayer." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Investigations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dossiers d'investigation — traçabilité complète.
          </p>
        </div>
        <button
          onClick={() => openNewInvestigation()}
          className="flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle investigation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total dossiers", value: counts.toutes, color: "#6366F1" },
          { label: "En cours", value: counts.en_cours, color: "#F59E0B" },
          { label: "Classées", value: counts.cloturee, color: "#64748B" },
          { label: "Transmises CENTIF", value: counts.transmise, color: "#EF4444" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
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
              "rounded-full px-1.5 py-0.5 text-xs font-semibold",
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
              Dossiers ({totalFiltered})
            </h3>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <FolderSearch className="h-7 w-7 animate-pulse" />
              <p className="mt-2 text-sm font-medium">Chargement des dossiers...</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pagedInvestigations.map((inv) => {
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
                      <p className="text-xs text-slate-400">{inv.dateOuverture}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                )
              })}
            </div>
          )}
          {!loading && totalFiltered > 0 && (
            <DataPagination
              page={page}
              totalPages={totalPages}
              total={totalFiltered}
              pageSize={20}
              onPageChange={setPage}
              itemLabel="dossiers"
              className="rounded-none border-x-0 border-b-0"
            />
          )}
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
                <button
                  onClick={() => { setDecisionType("cloturee"); setDecisionOpen(true) }}
                  disabled={submitting}
                  className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  Documenter une décision
                </button>
              ) : (
                <button
                  onClick={reopenInvestigation}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <User className="h-3.5 w-3.5" />
                  Rouvrir le dossier (responsable)
                </button>
              )}

              <p className="text-center text-xs text-slate-400">
                Traçabilité : auteur, date et décision enregistrés.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Decision modal */}
      {decisionOpen && selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setDecisionOpen(false)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Documenter une décision</h3>
                <p className="mt-0.5 text-xs text-slate-400">{selectedInv.ref} — {selectedInv.client}</p>
              </div>
              <button onClick={() => setDecisionOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-slate-600">Type de décision</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {([
                  { v: "cloturee", label: "Classer" },
                  { v: "transmise", label: "Transmettre au CENTIF" },
                  { v: "en_cours", label: "Maintenir en cours" },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setDecisionType(o.v)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                      decisionType === o.v
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-slate-600">Décision motivée</label>
              <textarea
                value={decisionText}
                onChange={(e) => setDecisionText(e.target.value)}
                rows={4}
                placeholder="Décrivez la décision et sa motivation..."
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDecisionOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={submitDecision}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {submitting ? "Enregistrement..." : "Valider la décision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

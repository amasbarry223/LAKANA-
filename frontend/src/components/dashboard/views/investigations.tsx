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
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useDashboard, type InvestigationStatus, type Investigation } from "@/lib/dashboard-context"
import { investigationService } from "@/services/investigationService"
import { DataPagination } from "@/components/ui/data-pagination"
import { usePaginatedFetch } from "@/hooks/use-pagination"
import { TableSkeleton, DetailPaneSkeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"

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
  const [decisionError, setDecisionError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Fermeture du modal de décision avec la touche Échap
  useEffect(() => {
    if (!decisionOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDecisionOpen(false)
        setDecisionError(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [decisionOpen])

  // Liste paginée côté serveur (source de vérité pour le tableau de dossiers)
  const {
    data: pagedInvestigations,
    total: totalFiltered,
    page,
    setPage,
    totalPages,
    loading,
    error,
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
      setDecisionError("Veuillez renseigner les motifs et justifications de la décision.")
      toast.error("Décision requise", { description: "Veuillez documenter la décision motivée avant de valider." })
      return
    }
    setDecisionError(null)
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
          { label: "Total dossiers", value: counts.toutes, color: "#070347" },
          { label: "En cours", value: counts.en_cours, color: "#D97706" },
          { label: "Classées", value: counts.cloturee, color: "#98A3B9" },
          { label: "Transmises CENTIF", value: counts.transmise, color: "#CD0D29" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  s.color === "#070347" ? "bg-[#070347] dark:bg-indigo-400" : ""
                )}
                style={s.color !== "#070347" ? { background: s.color } : undefined}
              />
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
          {error ? (
            <ErrorState
              error={error}
              onRetry={refetchInvestigations}
              title="Erreur de chargement des dossiers"
              message="Impossible d'accéder au registre des investigations. Vérifiez la connexion à l'API."
              className="my-6"
            />
          ) : loading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : pagedInvestigations.length === 0 ? (
            <EmptyState
              icon={FolderSearch}
              title={filter !== "toutes" ? "Aucun dossier pour ce statut" : "Aucun dossier d'investigation"}
              description={
                filter !== "toutes"
                  ? `Aucun dossier ne correspond au filtre "${filters.find((f) => f.key === filter)?.label}".`
                  : "Aucune investigation enregistrée. Les dossiers créés ou issus d'alertes apparaîtront ici."
              }
              actionLabel={filter !== "toutes" ? "Voir tous les dossiers" : "Ouvrir une nouvelle investigation"}
              onAction={filter !== "toutes" ? () => setFilter("toutes") : () => openNewInvestigation()}
              className="py-12"
            />
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
                      "flex w-full items-center gap-3 px-5 py-3.5 text-left transition cursor-pointer",
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
        {loading ? (
          <DetailPaneSkeleton className="xl:col-span-1" />
        ) : selectedInv ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 xl:col-span-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header du dossier */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{selectedInv.ref}</span>
                    <Badge variant="outline" className={cn("border text-[11px]", statusConfig[selectedInv.status].color)}>
                      {statusConfig[selectedInv.status].label}
                    </Badge>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedInv.client}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-400">Score</span>
                  <p className="font-mono text-base font-bold text-[#CD0D29]">{selectedInv.score}/100</p>
                </div>
              </div>

              {/* Synthèse fluide du dossier */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-400">Alerte liée</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedInv.alertRef}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-400">Typologie</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedInv.type}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-400">Analyste en charge</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedInv.analyste}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                  <span className="text-slate-400">Date d'ouverture</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedInv.dateOuverture}</span>
                </div>
                {selectedInv.dateCloture && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <span className="text-slate-400">Date de clôture</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedInv.dateCloture}</span>
                  </div>
                )}
              </div>

              {/* Justification & Décision motivée */}
              {selectedInv.decision && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="font-bold text-slate-700 dark:text-slate-300">Décision motivée :</p>
                  <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">{selectedInv.decision}</p>
                </div>
              )}

              {/* Pièces et notes */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedInv.notes} note(s)</span>
                </div>
                <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedInv.pieces} pièce(s)</span>
                </div>
              </div>
            </div>

            {/* Action principale */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
              {selectedInv.status === "en_cours" ? (
                <button
                  onClick={() => { setDecisionType("cloturee"); setDecisionOpen(true) }}
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#070347] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#0a0563] disabled:opacity-50"
                >
                  Documenter une décision
                </button>
              ) : (
                <button
                  onClick={reopenInvestigation}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <User className="h-3.5 w-3.5" />
                  Rouvrir le dossier
                </button>
              )}
            </div>
          </div>
        ) : !loading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-1 dark:border-slate-800 dark:bg-slate-900">
            <EmptyState
              variant="compact"
              icon={FolderSearch}
              title="Aucun dossier sélectionné"
              description="Sélectionnez un dossier dans la liste pour consulter ses détails."
            />
          </div>
        ) : null}
      </div>

      {/* Decision modal */}
      {decisionOpen && selectedInv && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => {
            setDecisionOpen(false)
            setDecisionError(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-modal-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 id="decision-modal-title" className="text-lg font-semibold text-slate-900">Documenter une décision</h3>
                <p className="mt-0.5 text-xs text-slate-400">{selectedInv.ref} — {selectedInv.client}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDecisionOpen(false)
                  setDecisionError(null)
                }}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
                aria-label="Fermer la boîte de dialogue"
              >
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
                    type="button"
                    onClick={() => setDecisionType(o.v)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-semibold transition cursor-pointer",
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
              <div className="flex items-center justify-between">
                <label htmlFor="decision-motivation-input" className="text-xs font-medium text-slate-600">
                  Décision motivée <span className="text-rose-500">*</span>
                </label>
                <span className="text-2xs text-slate-400">Exigence légale CENTIF</span>
              </div>
              <textarea
                id="decision-motivation-input"
                value={decisionText}
                onChange={(e) => {
                  setDecisionText(e.target.value)
                  if (decisionError) setDecisionError(null)
                }}
                rows={4}
                aria-invalid={!!decisionError}
                aria-describedby={decisionError ? "decision-error-hint" : undefined}
                placeholder="Décrivez la décision et sa motivation détaillée..."
                className={cn(
                  "mt-1 w-full rounded-lg border bg-slate-50 p-3 text-sm outline-none transition",
                  decisionError
                    ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                )}
              />
              {decisionError && (
                <p id="decision-error-hint" role="alert" className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 inline shrink-0" />
                  <span>{decisionError}</span>
                </p>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDecisionOpen(false)
                  setDecisionError(null)
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitDecision}
                disabled={submitting}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer",
                  decisionType === "transmise"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : decisionType === "cloturee"
                    ? "bg-slate-800 hover:bg-slate-900"
                    : "bg-indigo-600 hover:bg-indigo-700"
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {submitting
                    ? "Enregistrement cryptographique..."
                    : decisionType === "cloturee"
                    ? "Classer sans suite (Faux positif)"
                    : decisionType === "transmise"
                    ? "Transmettre au CENTIF"
                    : "Maintenir en cours d'investigation"}
                </span>
              </button>
            </div>

            <p className="mt-3 text-center text-2xs text-slate-400">
              Scellé SHA-256 : La décision motivée est enregistrée avec signature de l'analyste et horodatage certifié.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

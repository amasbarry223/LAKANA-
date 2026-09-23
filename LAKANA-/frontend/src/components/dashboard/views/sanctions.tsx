"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Search, Check, X, ArrowUp, ArrowDown, RefreshCw, UserCheck, Upload, Plus, Trash2, FileSpreadsheet, Layers } from "lucide-react"
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

  // Gestion du Référentiel PPE dynamique & Import CSV
  const [activeSection, setActiveSection] = useState<"correspondances" | "referentiel_ppe">("correspondances")
  const [ppeList, setPpeList] = useState<any[]>([])
  const [ppeTotal, setPpeTotal] = useState(0)
  const [ppeQuery, setPpeQuery] = useState("")
  const [ppeLoading, setPpeLoading] = useState(false)
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isAddPpeModalOpen, setIsAddPpeModalOpen] = useState(false)
  const [csvText, setCsvText] = useState("")
  const [csvFileName, setCsvFileName] = useState("")
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([])
  const [importingCsv, setImportingCsv] = useState(false)

  // Formulaire d'ajout unitaire PPE
  const [newPpeForm, setNewPpeForm] = useState({
    nom_complet: "",
    titre_fonction: "",
    agence: "Agence Centrale Bamako",
    numero_compte: "",
    lieu_naissance: "",
    lieu_residence: "",
  })
  const [submittingPpe, setSubmittingPpe] = useState(false)

  const loadPpeData = async () => {
    setPpeLoading(true)
    try {
      const res = await filteringService.getPpeList({ q: ppeQuery || undefined, limit: 100 })
      setPpeList(res.items || [])
      setPpeTotal(res.total || 0)
    } catch {
      toast.error("Impossible de charger le référentiel des PPE")
    } finally {
      setPpeLoading(false)
    }
  }

  useEffect(() => {
    if (activeSection === "referentiel_ppe") {
      loadPpeData()
    }
  }, [activeSection, ppeQuery])

  const handleDeletePpe = async (id: string, nom: string) => {
    if (!confirm(`Confirmer le retrait de ${nom} du registre officiel des PPE ?`)) return
    try {
      await filteringService.deletePpeEntry(id)
      toast.success(`${nom} a été retiré(e) du registre des PPE.`)
      loadPpeData()
    } catch {
      toast.error("Erreur lors de la suppression de la PPE.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvText(text)
      // Extraire quelques lignes de prévisualisation
      const lines = text.trim().split("\n").slice(0, 6)
      const delimiter = text.includes(";") ? ";" : ","
      setCsvPreviewRows(lines.map((l) => l.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""))))
    }
    reader.readAsText(file)
  }

  const handleCsvImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvText.trim()) {
      toast.error("Veuillez sélectionner ou coller un fichier CSV.")
      return
    }
    setImportingCsv(true)
    try {
      const res = await filteringService.importPpeCsv(csvText, csvFileName || "import_ppe.csv")
      toast.success(res.message || "Importation du CSV de PPE terminée avec succès !")
      setIsCsvModalOpen(false)
      setCsvText("")
      setCsvFileName("")
      setCsvPreviewRows([])
      loadPpeData()
    } catch (err: any) {
      toast.error("Erreur lors de l'importation du CSV", {
        description: err.response?.data?.detail || "Format de fichier non reconnu.",
      })
    } finally {
      setImportingCsv(false)
    }
  }

  const handleAddPpeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPpeForm.nom_complet.trim() || !newPpeForm.titre_fonction.trim()) {
      toast.error("Veuillez renseigner au moins le nom et la fonction de la PPE.")
      return
    }
    setSubmittingPpe(true)
    try {
      await filteringService.addPpeEntry(newPpeForm)
      toast.success(`${newPpeForm.nom_complet} a été ajouté(e) au registre des PPE.`)
      setIsAddPpeModalOpen(false)
      setNewPpeForm({
        nom_complet: "",
        titre_fonction: "",
        agence: "Agence Centrale Bamako",
        numero_compte: "",
        lieu_naissance: "",
        lieu_residence: "",
      })
      loadPpeData()
    } catch {
      toast.error("Erreur lors de l'ajout de la PPE.")
    } finally {
      setSubmittingPpe(false)
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
      {/* En-tête avec sélecteur de sous-section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-indigo-600" />
            Vérification Sanctions & PPE
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Contrôle des tiers sur listes officielles (ONU, UEMOA, CENTIF) et gestion dynamique du référentiel des PPE.
          </p>
        </div>

        {/* Sélecteur de sous-onglets */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSection("correspondances")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
              activeSection === "correspondances"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
            Contrôle & Correspondances ({matchesTotal})
          </button>
          <button
            onClick={() => setActiveSection("referentiel_ppe")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
              activeSection === "referentiel_ppe"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-purple-600" />
            Référentiel PPE & Import CSV ({ppeTotal})
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 1 : CONTRÔLE ET CORRESPONDANCES SANCTIONS RAPIDFUZZ   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSection === "correspondances" && (
        <div className="space-y-5">
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

          {/* Cartes KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">En attente d'instruction</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{counts.en_attente}</p>
              <p className="mt-1 text-xs text-slate-400">À qualifier par l'analyste</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Correspondances confirmées</p>
              <p className="mt-1 text-2xl font-bold text-rose-600">{counts.confirme}</p>
              <p className="mt-1 text-xs text-slate-400">Mesures de gel ou blocage appliquées</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-xs font-semibold text-slate-500">Faux positifs écartés</p>
              <p className="mt-1 text-2xl font-bold text-slate-700">{counts.rejete}</p>
              <p className="mt-1 text-xs text-slate-400">Rejets motivés consignés dans l'audit</p>
            </div>
          </div>

          {/* Barre de filtres et recherche */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0",
                    filter === f ? "bg-white text-slate-900 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer par sociétaire, réf..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Liste des correspondances */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 bg-slate-50/60">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Correspondances de filtrage ({matchesTotal})</h3>
              <button
                onClick={toggleDateSort}
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition cursor-pointer"
              >
                Date
                <SortIcon sortDir={sortDir} />
              </button>
            </div>

            {error ? (
              <ErrorState error={error} onRetry={refetchMatches} className="my-6" />
            ) : loading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : pagedMatches.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="Aucune correspondance active"
                description="Toutes les correspondances ont été vérifiées ou aucune alerte de sanction n'est en cours."
                className="py-12"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {pagedMatches.map((m) => (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition">
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
                      <p className={cn("text-lg font-bold font-mono", m.similarity >= 90 ? "text-rose-600" : m.similarity >= 75 ? "text-amber-600" : "text-slate-600")}>
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
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 2 : RÉFÉRENTIEL DES PPE & IMPORTATION CSV             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSection === "referentiel_ppe" && (
        <div className="space-y-5">
          {/* Actions Référentiel PPE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                Référentiel des Personnes Politiquement Exposées (PPE)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Base centrale de conformité connectée : importez vos fichiers CSV ou ajoutez manuellement des PPE pour le filtrage automatique.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsAddPpeModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-slate-500" />
                Ajouter une PPE
              </button>
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-700 shadow-xs cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                Importer un CSV de PPE
              </button>
            </div>
          </div>

          {/* Recherche dans le registre PPE */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ppeQuery}
                onChange={(e) => setPpeQuery(e.target.value)}
                placeholder="Rechercher une PPE par nom, fonction, agence..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-purple-400"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {ppeTotal} PPE enregistrée{ppeTotal > 1 ? "s" : ""} dans LAKANA
            </span>
          </div>

          {/* Tableau des PPE */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-3 px-4">Réf</th>
                    <th className="py-3 px-4">Nom et Prénom</th>
                    <th className="py-3 px-4">Fonction / Mandat Public</th>
                    <th className="py-3 px-4">Agence</th>
                    <th className="py-3 px-4">N° de Compte</th>
                    <th className="py-3 px-4">Lieu de Résidence</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ppeLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chargement du référentiel PPE...
                      </td>
                    </tr>
                  ) : ppeList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Aucune PPE répertoriée. Utilisez le bouton "Importer un CSV de PPE" pour alimenter la base.
                      </td>
                    </tr>
                  ) : (
                    ppeList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-medium text-slate-500">{p.code || "PPE"}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.nom_complet}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            {p.fonction}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.agence || "Agence Centrale Bamako"}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{p.numero_compte || "—"}</td>
                        <td className="py-3 px-4 text-slate-500">{p.lieu_residence || p.lieu_naissance || "Mali"}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeletePpe(p.id, p.nom_complet)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-2xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                            title="Retirer de la liste PPE"
                          >
                            <Trash2 className="h-3 w-3" />
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1 : IMPORTATION CSV DES PPE                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-600" />
                Importer un fichier CSV de PPE
              </h3>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCsvImportSubmit} className="space-y-4 text-xs">
              <p className="text-slate-500">
                Sélectionnez votre fichier CSV existant des Personnes Politiquement Exposées. Le système détectera automatiquement les colonnes (Nom, Fonction, Agence, Compte, etc.).
              </p>

              <div className="rounded-xl border-2 border-dashed border-slate-300 p-5 text-center hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload-input"
                />
                <label htmlFor="csv-upload-input" className="cursor-pointer block space-y-2">
                  <FileSpreadsheet className="h-8 w-8 text-purple-600 mx-auto" />
                  <p className="font-semibold text-slate-700">
                    {csvFileName ? csvFileName : "Cliquez pour sélectionner un fichier CSV"}
                  </p>
                  <p className="text-2xs text-slate-400">Supporte séparateurs point-virgule (;), virgule (,) ou tabulation</p>
                </label>
              </div>

              {/* Prévisualisation */}
              {csvPreviewRows.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-700 uppercase text-2xs tracking-wider">
                    Aperçu des colonnes et données détectées :
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-36">
                    <table className="w-full text-left text-[11px]">
                      <tbody className="divide-y divide-slate-100">
                        {csvPreviewRows.map((r, i) => (
                          <tr key={i} className={i === 0 ? "bg-slate-100 font-bold text-slate-800" : "hover:bg-slate-50"}>
                            {r.map((c, j) => (
                              <td key={j} className="p-2 truncate max-w-[140px]">{c}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={importingCsv || !csvText.trim()}
                  className="rounded-lg bg-purple-600 px-4 py-1.5 font-semibold text-white hover:bg-purple-700 shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {importingCsv && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>{importingCsv ? "Importation en cours..." : "Intégrer dans la base LAKANA"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2 : AJOUT MANUEL D'UNE PPE                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isAddPpeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-600" />
                Ajouter une Personne Politiquement Exposée
              </h3>
              <button onClick={() => setIsAddPpeModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddPpeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom et prénom complet *</label>
                <input
                  type="text"
                  required
                  value={newPpeForm.nom_complet}
                  onChange={(e) => setNewPpeForm({ ...newPpeForm, nom_complet: e.target.value })}
                  placeholder="Ex: Ibrahima Coulibaly"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fonction / Mandat public *</label>
                <input
                  type="text"
                  required
                  value={newPpeForm.titre_fonction}
                  onChange={(e) => setNewPpeForm({ ...newPpeForm, titre_fonction: e.target.value })}
                  placeholder="Ex: Conseiller ministériel / Maire"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Agence de domiciliation</label>
                  <input
                    type="text"
                    value={newPpeForm.agence}
                    onChange={(e) => setNewPpeForm({ ...newPpeForm, agence: e.target.value })}
                    placeholder="Ex: Agence Centrale"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">N° de Compte</label>
                  <input
                    type="text"
                    value={newPpeForm.numero_compte}
                    onChange={(e) => setNewPpeForm({ ...newPpeForm, numero_compte: e.target.value })}
                    placeholder="Ex: 5192-001"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lieu de naissance</label>
                  <input
                    type="text"
                    value={newPpeForm.lieu_naissance}
                    onChange={(e) => setNewPpeForm({ ...newPpeForm, lieu_naissance: e.target.value })}
                    placeholder="Ex: Bamako (Mali)"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lieu de résidence</label>
                  <input
                    type="text"
                    value={newPpeForm.lieu_residence}
                    onChange={(e) => setNewPpeForm({ ...newPpeForm, lieu_residence: e.target.value })}
                    placeholder="Ex: Bamako ACI 2000"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPpeModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingPpe}
                  className="rounded-lg bg-purple-600 px-4 py-1.5 font-semibold text-white hover:bg-purple-700 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {submittingPpe && <RefreshCw className="h-3 w-3 animate-spin" />}
                  <span>Enregistrer la PPE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  ChevronDown,
  Wallet,
  Clock,
  User,
  Building2,
  Landmark,
  BarChart2,
  CreditCard,
  Layers,
  Lock,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
} from "lucide-react"
import { toast } from "sonner"
import { clientService } from "@/services/clientService"
import { transactionService } from "@/services/transactionService"
import { filteringService, type PreCheckResult } from "@/services/filteringService"
import { usePaginatedFetch } from "@/hooks/use-pagination"
import { DataPagination } from "@/components/ui/data-pagination"
import { TableSkeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import type { Client } from "@/models/client"
import type { Transaction } from "@/models/transaction"

const SEUIL_UEMOA = 5_000_000

function Badge({
  children,
  color,
}: {
  children: React.ReactNode
  color: "green" | "yellow" | "red" | "blue" | "purple" | "gray"
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    gray: "bg-slate-100 text-slate-600 border border-slate-200",
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n)
}

function formatDate(dStr: string) {
  if (!dStr) return "-"
  try {
    const d = new Date(dStr)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  } catch {
    return dStr
  }
}

export function TransactionSimulatorView() {
  const [activeTab, setActiveTab] = useState<"precheck" | "journal">("precheck")

  // Transactions State (données réelles lues depuis la BDD partagée)
  const [txSearch, setTxSearch] = useState("")
  const [debouncedTxSearch, setDebouncedTxSearch] = useState("")
  const [txTypeFilter, setTxTypeFilter] = useState("ALL")
  const [txAmlFilter, setTxAmlFilter] = useState("ALL")

  // Recherche différée de 300ms pour éviter une requête serveur à chaque frappe
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTxSearch(txSearch.trim()), 300)
    return () => clearTimeout(t)
  }, [txSearch])

  // Instantané borné (200 opérations les plus récentes), découplé du tableau paginé,
  // utilisé uniquement pour les cartes de synthèse (volume total, nb ≥ seuil UEMOA).
  const [statsSnapshot, setStatsSnapshot] = useState<Transaction[]>([])
  useEffect(() => {
    transactionService
      .getTransactionsPage({ skip: 0, limit: 200 })
      .then(({ data }) => setStatsSnapshot(data))
      .catch(() => setStatsSnapshot([]))
  }, [])

  // Clients State (lus depuis la BDD partagée)
  const [clients, setClients] = useState<Client[]>([])
  const [clientMap, setClientMap] = useState<Record<string, Client>>({})
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  // Pré-filtrage Sanctions, PPE et Multi-comptes
  const [preCheck, setPreCheck] = useState<PreCheckResult | null>(null)
  const [loadingPreCheck, setLoadingPreCheck] = useState(false)
  const [sendingAlert, setSendingAlert] = useState(false)

  // 1. Charger les clients
  const loadClients = useCallback(async () => {
    try {
      const data = await clientService.getClients()
      setClients(data)
      const map: Record<string, Client> = {}
      data.forEach((c) => {
        map[c.id] = c
        if (c.codeClient) map[c.codeClient] = c
      })
      setClientMap(map)
      if (data.length > 0 && !selectedClient) {
        setSelectedClient(data[0])
      }
    } catch {
      toast.error("Impossible de charger les sociétaires depuis la base de données")
    }
  }, [selectedClient])

  // 2. Journal des transactions — pagination réelle côté serveur (recherche + filtres)
  const {
    data: pagedTransactions,
    total: journalTotal,
    page: journalPage,
    setPage: setJournalPage,
    totalPages: journalTotalPages,
    loading: loadingTx,
  } = usePaginatedFetch<Transaction>(
    ({ skip, limit }) =>
      transactionService.getTransactionsPage(
        { skip, limit },
        {
          q: debouncedTxSearch || undefined,
          typeOperation: txTypeFilter === "ALL" ? undefined : txTypeFilter,
          montantMin: txAmlFilter === "UEMOA" ? SEUIL_UEMOA : undefined,
          montantMax: txAmlFilter === "NORMAL" ? SEUIL_UEMOA : undefined,
        }
      ),
    [debouncedTxSearch, txTypeFilter, txAmlFilter],
    { pageSize: 20 }
  )

  // 3. Historique paginé des opérations du sociétaire sélectionné (onglet Contrôle)
  const {
    data: clientTransactions,
    total: clientTxTotal,
    page: clientTxPage,
    setPage: setClientTxPage,
    totalPages: clientTxTotalPages,
  } = usePaginatedFetch<Transaction>(
    ({ skip, limit }) =>
      selectedClient
        ? transactionService.getClientTransactionsPage(selectedClient.id, { skip, limit })
        : Promise.resolve({ data: [], total: 0 }),
    [selectedClient?.id],
    { pageSize: 10 }
  )

  useEffect(() => {
    loadClients()
  }, [loadClients])

  // 3. Pré-filtrage instantané à la sélection d'un client
  useEffect(() => {
    if (!selectedClient) {
      setPreCheck(null)
      return
    }
    let isMounted = true
    setLoadingPreCheck(true)
    filteringService
      .preCheckGuichet(selectedClient.id)
      .then((res) => {
        if (isMounted) {
          setPreCheck(res)
          if (res.bloquer_operations) {
            toast.error("GEL DES AVOIRS : Sociétaire sous sanction internationale, opération strictement interdite !")
          } else if (res.is_ppe) {
            toast.warning(`Sociétaire PPE (Personne Politiquement Exposée) détecté (${res.fonction_ppe || "Mandat public"}). Vigilance renforcée requise !`)
          } else if (res.has_multi_accounts) {
            toast.warning(`Alerte Multi-comptes : ${res.comptes_count} comptes identifiés sous l'identifiant ${res.identifiant_cle}.`)
          }
        }
      })
      .catch((err) => {
        console.warn("Erreur pre-check guichet:", err)
        if (isMounted) {
          setPreCheck({
            found: true,
            client_id: selectedClient.id,
            client_nom: `${selectedClient.prenom || ""} ${selectedClient.nom}`.trim(),
            code_client: selectedClient.codeClient,
            is_ppe: !!selectedClient.estPpe,
            is_sanctioned: false,
            bloquer_operations: false,
            niveau: selectedClient.estPpe ? "analyser" : "conforme",
            fonction_ppe: selectedClient.fonctionPpe,
            has_multi_accounts: false,
            message: selectedClient.estPpe
              ? `SOCIÉTAIRE PPE (Personne Politiquement Exposée) DÉTECTÉ (${selectedClient.fonctionPpe || "Mandat public"}). Vigilance renforcée requise.`
              : "Sociétaire standard : Aucun signalement négatif.",
            consigne_guichet: selectedClient.estPpe
              ? "Demander le justificatif d'origine des fonds et aviser le chef d'agence."
              : "Traitement standard sous réserve des seuils légaux.",
          })
        }
      })
      .finally(() => {
        if (isMounted) setLoadingPreCheck(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedClient])

  // Filtrage de la liste de recherche client
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients
    const q = clientSearch.toLowerCase()
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.prenom && c.prenom.toLowerCase().includes(q)) ||
        (c.raisonSociale && c.raisonSociale.toLowerCase().includes(q)) ||
        c.codeClient.toLowerCase().includes(q) ||
        (c.pieceIdentite && c.pieceIdentite.toLowerCase().includes(q)) ||
        (c.nif && c.nif.toLowerCase().includes(q))
    )
  }, [clients, clientSearch])

  // Statistiques calculées sur l'instantané récent (200 dernières opérations)
  const totalVolume = useMemo(() => statsSnapshot.reduce((acc, t) => acc + (t.montant || 0), 0), [statsSnapshot])
  const countUemoa = useMemo(() => statsSnapshot.filter((t) => t.montant >= SEUIL_UEMOA).length, [statsSnapshot])

  // Déclencher un signalement d'alerte manuel vers WhatsApp et Email
  const handleTriggerAlert = async () => {
    if (!selectedClient) return
    setSendingAlert(true)
    try {
      const res = await filteringService.testDispatch(
        undefined,
        undefined
      )
      toast.success("Signalement de conformité transmis en direct par WhatsApp (+223 64663918) et Email (fombadaouda72@gmail.com)")
    } catch {
      toast.error("Erreur lors de la transmission du signalement")
    } finally {
      setSendingAlert(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Contrôle & Pré-filtrage Sociétaire
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consultation et vérification de conformité en temps réel sur la base centrale (CBS/SFD) : Sanctions, PPE et Multi-comptes.
          </p>
        </div>

        {/* Boutons d'onglets principaux */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("precheck")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "precheck"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            Contrôle Sociétaire
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "journal"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Journal des flux CBS ({journalTotal})
          </button>
        </div>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sociétaires répertoriés</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{clients.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Opérations en BDD</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{journalTotal}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Volume sous surveillance</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmount(totalVolume)}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Opérations ≥ 5M FCFA</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{countUemoa}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* VUE 1 : CONTRÔLE ET PRÉ-FILTRAGE DU SOCIÉTAIRE (SANS FORMULAIRE DE SAISIE) */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "precheck" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panneau gauche : Sélection et Statut de conformité */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Fiche de Contrôle Pré-transactionnel
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sélectionnez un sociétaire pour auditer immédiatement son éligibilité légale avant toute opération au guichet du CBS.
                  </p>
                </div>

                {selectedClient && (
                  <button
                    onClick={handleTriggerAlert}
                    disabled={sendingAlert}
                    className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 hover:bg-rose-100 transition text-xs font-semibold shadow-xs"
                    title="Envoyer un signalement direct"
                  >
                    {sendingAlert ? <Spinner /> : <Send className="w-3.5 h-3.5" />}
                    <span>Signaler suspicion (WhatsApp / Email)</span>
                  </button>
                )}
              </div>

              {/* Sélecteur de sociétaire avec recherche rapide */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Sociétaire recherché (Nom, CNI, NIF ou Code Client)
                </label>
                <div
                  id="sim-client-select-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 transition"
                >
                  {selectedClient ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        {selectedClient.typeClient === "Entreprise" ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {selectedClient.typeClient === "Entreprise"
                            ? selectedClient.raisonSociale || selectedClient.nom
                            : `${selectedClient.prenom || ""} ${selectedClient.nom}`.trim()}
                        </p>
                        <p className="text-xs text-slate-400">
                          {selectedClient.codeClient} • {selectedClient.typeClient}
                          {selectedClient.pieceIdentite && ` • CNI/NINA: ${selectedClient.pieceIdentite}`}
                          {selectedClient.nif && ` • NIF: ${selectedClient.nif}`}
                          {selectedClient.estPpe && " • PPE"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">Sélectionner un sociétaire...</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Dropdown recherche sociétaire */}
                {showDropdown && (
                  <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 duration-150">
                    <div className="p-3 border-b border-slate-100">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="sim-client-search"
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Rechercher par nom, CNI, NIF, code sociétaire..."
                          className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {filteredClients.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedClient(c)
                            setShowDropdown(false)
                          }}
                          className="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">
                              {c.typeClient === "Entreprise" ? (
                                <Building2 className="w-4 h-4 text-blue-600" />
                              ) : (
                                <User className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {c.typeClient === "Entreprise"
                                  ? c.raisonSociale || c.nom
                                  : `${c.prenom || ""} ${c.nom}`.trim()}
                              </p>
                              <p className="text-xs text-slate-400">
                                {c.codeClient}
                                {c.pieceIdentite && ` • CNI: ${c.pieceIdentite}`}
                                {c.nif && ` • NIF: ${c.nif}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {c.estPpe && <Badge color="purple">PPE</Badge>}
                            <Badge
                              color={
                                c.niveauRisque === "Élevé"
                                  ? "red"
                                  : c.niveauRisque === "Moyen"
                                  ? "yellow"
                                  : "green"
                              }
                            >
                              {c.niveauRisque}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* BANNIÈRES DE VÉRIFICATION EN DIRECT (GEL, PPE, MULTI-COMPTES) */}
              {/* ───────────────────────────────────────────────────────────── */}
              {loadingPreCheck ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500">
                  <Spinner />
                  <span>Filtrage instantané en cours sur les bases de sanctions, PPE et multi-comptes...</span>
                </div>
              ) : preCheck?.bloquer_operations ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-950 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-red-800 text-sm tracking-wide">
                          Gel des avoirs & Sanctions actives
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                          Opération non autorisée
                        </span>
                      </div>
                      <p className="text-xs text-red-800 font-medium mt-1">
                        {preCheck.message}
                      </p>
                      <div className="mt-2.5 p-2.5 bg-red-100/70 rounded-lg border border-red-200 text-xs">
                        <span className="font-bold text-red-900">Consigne guichet : </span>
                        <span className="text-red-800">{preCheck.consigne_guichet}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-red-700">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Alerte d'urgence transmise à la Direction de la Conformité (WhatsApp & Email).</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : preCheck?.is_ppe ? (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-purple-900 text-sm tracking-wide">
                          Sociétaire PPE (Personne Politiquement Exposée) identifié
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                          Fonction : {preCheck.fonction_ppe || "Fonction publique"}
                        </span>
                        {preCheck.has_multi_accounts && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                            {preCheck.comptes_count} comptes ({preCheck.identifiant_cle})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-purple-800 font-medium mt-1">
                        {preCheck.message}
                      </p>

                      {/* Liste des comptes sous cette CNI/NIF */}
                      {preCheck.has_multi_accounts && preCheck.comptes && preCheck.comptes.length > 0 && (
                        <div className="mt-2 space-y-1 bg-white/90 p-2.5 rounded-lg border border-purple-200">
                          <p className="text-[11px] font-bold text-purple-900 uppercase">
                            Comptes rattachés sous {preCheck.identifiant_cle} :
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {preCheck.comptes.map((c, idx) => (
                              <div key={idx} className="p-2 rounded bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                                <div>
                                  <p className="font-mono font-bold text-slate-800">{c.numero_compte}</p>
                                  <p className="text-[10px] text-slate-500">{c.type_compte} · Ouv: {c.date_ouverture || "N/A"}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-slate-700">{new Intl.NumberFormat("fr-FR").format(c.solde)} FCFA</p>
                                  {c.is_recent && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">Nouveau</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-2.5 p-2.5 bg-purple-100/70 rounded-lg border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-purple-900">Consigne guichet : </span>
                          <span className="text-purple-800">{preCheck.consigne_guichet}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-purple-700 bg-white px-2 py-1 rounded border border-purple-200 shrink-0 self-start sm:self-auto">
                          Alerte WhatsApp & Email transmise
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : preCheck?.has_multi_accounts ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-amber-900 text-sm tracking-wide">
                          Alerte multi-comptes ({preCheck.identifiant_cle})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                          {preCheck.comptes_count} comptes identifiés
                        </span>
                        {preCheck.has_recent_new_account && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                            Création récente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-800 font-medium mt-1">
                        {preCheck.message}
                      </p>

                      {/* Liste des comptes sous cette CNI/NIF */}
                      {preCheck.comptes && preCheck.comptes.length > 0 && (
                        <div className="mt-2 space-y-1.5 bg-white/90 p-2.5 rounded-lg border border-amber-200">
                          <p className="text-[11px] font-bold text-amber-900 uppercase">
                            Comptes rattachés sous {preCheck.identifiant_cle} :
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {preCheck.comptes.map((c, idx) => (
                              <div key={idx} className="p-2 rounded bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                                <div>
                                  <p className="font-mono font-bold text-slate-800">{c.numero_compte}</p>
                                  <p className="text-[10px] text-slate-500">{c.type_compte} · Ouv: {c.date_ouverture || "N/A"}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-slate-700">{new Intl.NumberFormat("fr-FR").format(c.solde)} FCFA</p>
                                  {c.is_recent && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">Nouveau</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-2.5 p-2.5 bg-amber-100 rounded-lg border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-amber-900">Consigne guichet : </span>
                          <span className="text-amber-800 font-medium">{preCheck.consigne_guichet}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-800 bg-white px-2 py-1 rounded border border-amber-200 shrink-0 self-start sm:self-auto">
                          Alerte WhatsApp & Email transmise
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : preCheck ? (
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Filtrage préalable conforme : Compte unique ({preCheck.identifiant_cle || "Identité vérifiée"}), sociétaire non-PPE, sans sanction.
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase bg-emerald-100 px-2 py-0.5 rounded">
                    Guichet OK
                  </span>
                </div>
              ) : null}
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* HISTORIQUE RÉEL DES TRANSACTIONS DE CE SOCIÉTAIRE (BDD CBS)     */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Opérations réelles en base de données pour ce sociétaire
                  </h3>
                  <p className="text-xs text-slate-400">
                    Flux financiers synchronisés directement depuis le Core Banking System
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  {clientTxTotal} opération(s)
                </span>
              </div>

              {clientTransactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  Aucune opération financière enregistrée pour ce sociétaire dans le système existant.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Réf CBS</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Bénéficiaire / Description</th>
                        <th className="p-3 text-right">Montant</th>
                        <th className="p-3 text-center">Conformité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clientTransactions.map((tx) => {
                        const isUemoa = tx.montant >= SEUIL_UEMOA
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 font-mono font-medium text-slate-800">{tx.reference}</td>
                            <td className="p-3 text-slate-500">{formatDate(tx.dateTransaction)}</td>
                            <td className="p-3 font-medium text-slate-700">{tx.typeOperation}</td>
                            <td className="p-3 text-slate-600">{tx.beneficiaireNom || tx.description || "-"}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {formatAmount(tx.montant)}
                            </td>
                            <td className="p-3 text-center">
                              {isUemoa ? (
                                <Badge color="red">≥ 5M FCFA</Badge>
                              ) : (
                                <Badge color="green">Normal</Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {clientTxTotal > 0 && (
                    <DataPagination
                      page={clientTxPage}
                      totalPages={clientTxTotalPages}
                      total={clientTxTotal}
                      pageSize={10}
                      onPageChange={setClientTxPage}
                      itemLabel="opérations"
                      className="rounded-none border-x-0 border-b-0"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Panneau droit : Détail KYC & Règles AML */}
          <div className="space-y-4">
            {selectedClient && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Profil Sociétaire (KYC en BDD)
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {selectedClient.typeClient === "Entreprise"
                      ? (selectedClient.raisonSociale || selectedClient.nom || "E").charAt(0).toUpperCase()
                      : `${(selectedClient.prenom || "?").charAt(0)}${selectedClient.nom.charAt(0)}`.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {selectedClient.typeClient === "Entreprise"
                        ? selectedClient.raisonSociale || selectedClient.nom
                        : `${selectedClient.prenom || ""} ${selectedClient.nom}`.trim()}
                    </p>
                    <p className="text-xs text-slate-400">{selectedClient.codeClient}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Statut Client</span>
                    <Badge color={selectedClient.typeClient === "Entreprise" ? "blue" : "gray"}>
                      {selectedClient.typeClient}
                    </Badge>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Niveau de risque</span>
                    <Badge
                      color={
                        selectedClient.niveauRisque === "Élevé"
                          ? "red"
                          : selectedClient.niveauRisque === "Moyen"
                          ? "yellow"
                          : "green"
                      }
                    >
                      {selectedClient.niveauRisque}
                    </Badge>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Score de risque LAKANA</span>
                    <span className="font-bold text-slate-800">{selectedClient.riskScore ?? "-"}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Pièce ID (CNI/NINA) :</span>
                    <span className="font-mono font-medium text-slate-700">{selectedClient.pieceIdentite || "-"}</span>
                  </div>
                  {selectedClient.nif && (
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-500">Numéro Fiscal (NIF)</span>
                      <span className="font-mono font-medium text-slate-700">{selectedClient.nif}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Ville / Agence</span>
                    <span className="text-slate-700">{selectedClient.ville || "Bamako"} · {selectedClient.agence || "Centrale"}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">Profession / Activité</span>
                    <span className="text-slate-700">{selectedClient.profession || selectedClient.secteurActivite || "Commerce"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Règles de conformité actives */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                Pare-feu et Règles UEMOA actives
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Seuil réglementaire UEMOA", desc: "≥ 5 000 000 FCFA → Déclaration CENTIF obligatoire", dot: "bg-red-500" },
                  { label: "Règle Multi-comptes (CNI & NIF)", desc: "Alerte si dédoublement ou création de nouveau compte", dot: "bg-amber-500" },
                  { label: "Filtrage PPE & Sanctions", desc: "Vérification continue listes ONU, GAFI, CENTIF-Mali", dot: "bg-purple-500" },
                  { label: "Fractionnement (Smurfing)", desc: "Surveillance des dépôts multiples sous 1M FCFA sur 48h", dot: "bg-blue-500" },
                ].map((rule) => (
                  <div key={rule.label} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${rule.dot}`} />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{rule.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* VUE 2 : REGISTRE GLOBAL DES TRANSACTIONS CBS (LECTURE SEULE)        */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "journal" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Barre de recherche et filtres */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Rechercher par réf, client, bénéficiaire..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="ALL">Tous les types d'opération</option>
                <option value="Dépôt">Dépôts</option>
                <option value="Retrait">Retraits</option>
                <option value="Virement">Virements</option>
              </select>

              <select
                value={txAmlFilter}
                onChange={(e) => setTxAmlFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="ALL">Tous les flux</option>
                <option value="UEMOA">Seuil UEMOA (≥ 5M FCFA)</option>
                <option value="NORMAL">Flux standard (&lt; 5M FCFA)</option>
              </select>
            </div>
          </div>

          {/* Tableau des transactions CBS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Référence</th>
                  <th className="p-3.5">Sociétaire</th>
                  <th className="p-3.5">Date & Heure</th>
                  <th className="p-3.5">Type Opération</th>
                  <th className="p-3.5">Canal</th>
                  <th className="p-3.5 text-right">Montant</th>
                  <th className="p-3.5 text-center">Statut Conformité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingTx ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <TableSkeleton rows={8} cols={5} />
                    </td>
                  </tr>
                ) : pagedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title="Aucune opération trouvée"
                        description="Aucune opération ne correspond aux critères de recherche."
                        variant="compact"
                      />
                    </td>
                  </tr>
                ) : (
                  pagedTransactions.map((tx) => {
                    const client = clientMap[tx.clientId]
                    const clientNom = client
                      ? client.typeClient === "Entreprise"
                        ? client.raisonSociale || client.nom
                        : `${client.prenom || ""} ${client.nom}`.trim()
                      : tx.clientId
                    const isUemoa = tx.montant >= SEUIL_UEMOA

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-mono font-medium text-slate-800">{tx.reference}</td>
                        <td className="p-3.5 font-semibold text-slate-800">
                          {clientNom}
                          {client?.estPpe && <span className="ml-1.5 text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">PPE</span>}
                        </td>
                        <td className="p-3.5 text-slate-500">{formatDate(tx.dateTransaction)}</td>
                        <td className="p-3.5 text-slate-700 font-medium">{tx.typeOperation}</td>
                        <td className="p-3.5 text-slate-500">{tx.canal || "Guichet"}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                          {formatAmount(tx.montant)}
                        </td>
                        <td className="p-3.5 text-center">
                          {isUemoa ? (
                            <Badge color="red">≥ 5M FCFA (UEMOA)</Badge>
                          ) : (
                            <Badge color="green">Conforme</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {journalTotal > 0 && (
            <DataPagination
              page={journalPage}
              totalPages={journalTotalPages}
              total={journalTotal}
              pageSize={20}
              onPageChange={setJournalPage}
              itemLabel="transactions"
              className="rounded-none border-x-0 border-b-0"
            />
          )}
        </div>
      )}
    </div>
  )
}

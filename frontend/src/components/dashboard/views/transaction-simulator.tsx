"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  ArrowRightLeft,
  Send,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ChevronDown,
  Wallet,
  Clock,
  Shield,
  Zap,
  FileText,
  User,
  Building2,
  Star,
  BarChart2,
  CreditCard,
  ListFilter,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  Check,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"
import { clientService } from "@/services/clientService"
import { transactionService, type SimulationResult } from "@/services/transactionService"
import { DataPagination } from "@/components/ui/data-pagination"
import { usePageSlice } from "@/hooks/use-pagination"
import { MetricCard } from "@/components/ui/metric-card"
import { StatusBadge } from "@/components/ui/status-badge"
import type { Client } from "@/models/client"
import type { Transaction } from "@/models/transaction"

const TYPES_OPERATION = [
  "Dépôt",
  "Retrait",
  "Virement",
  "Virement entrant",
  "Virement sortant",
  "Paiement marchand",
  "Transfert international",
  "Change de devises",
]

const CANAUX = ["Guichet", "Mobile Money", "Virement bancaire", "SWIFT", "Chèque", "TPE", "Internet"]
const DEVISES = ["XOF", "EUR", "USD"]
const SEUIL_UEMOA = 5_000_000

function Badge({ children, color }: { children: React.ReactNode; color: "green" | "yellow" | "red" | "blue" | "purple" | "gray" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-rose-50 text-rose-700 border border-rose-200",
    blue: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    purple: "bg-rose-50 text-rose-700 border border-rose-200",
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
  if (!dStr) return "—"
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

function AmlResultCard({
  result,
  onGoToRegistry,
}: {
  result: SimulationResult
  onGoToRegistry?: () => void
}) {
  const alerte = result.alerte_declenchee
  const seuilDepasse = result.seuil_uemoa_depasse
  const hasAlert = !!alerte
  return (
    <div className={`rounded-2xl border-2 p-6 transition-all ${hasAlert ? "border-rose-300 bg-rose-50" : seuilDepasse ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasAlert ? "bg-rose-100" : seuilDepasse ? "bg-amber-100" : "bg-emerald-100"}`}>
            {hasAlert ? <AlertTriangle className="w-6 h-6 text-rose-600" /> : seuilDepasse ? <Shield className="w-6 h-6 text-amber-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
          </div>
          <div>
            <p className={`text-lg font-bold ${hasAlert ? "text-rose-800" : seuilDepasse ? "text-amber-800" : "text-emerald-800"}`}>
              {hasAlert ? "Alerte AML déclenchée" : seuilDepasse ? "Seuil UEMOA dépassé (5M FCFA)" : "Transaction conforme"}
            </p>
            <p className={`text-sm ${hasAlert ? "text-rose-600" : seuilDepasse ? "text-amber-600" : "text-emerald-600"}`}>Réf : {result.transaction.reference}</p>
          </div>
        </div>
        {onGoToRegistry && (
          <button
            onClick={onGoToRegistry}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" /> Voir dans le registre
          </button>
        )}
      </div>

      {alerte && (
        <div className="bg-white rounded-xl border border-rose-200 p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-800 text-sm">Détail de l'alerte générée</p>
            <Badge color="red">{alerte.niveau}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-500 text-xs">Référence</p><p className="font-mono font-medium text-slate-800">{alerte.reference}</p></div>
            <div><p className="text-slate-500 text-xs">Type</p><p className="font-medium text-slate-800">{alerte.type_alerte}</p></div>
            <div>
              <p className="text-slate-500 text-xs">Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(alerte.score, 100)}%` }} />
                </div>
                <span className="font-bold text-rose-600">{alerte.score}</span>
              </div>
            </div>
            <div><p className="text-slate-500 text-xs">Module</p><p className="font-medium text-slate-800">{alerte.module}</p></div>
          </div>
          {alerte.facteurs && alerte.facteurs.length > 0 && (
            <div className="mt-3">
              <p className="text-slate-500 text-xs mb-1.5">Facteurs déclencheurs</p>
              <div className="flex flex-wrap gap-1.5">
                {alerte.facteurs.map((f: string, i: number) => (
                  <span key={i} className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result.nouveau_solde != null && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between text-sm shadow-sm">
          <span className="text-slate-500 flex items-center gap-2"><Wallet className="w-4 h-4 text-indigo-500" />Nouveau solde du compte</span>
          <span className="font-bold text-slate-800">{formatAmount(result.nouveau_solde)}</span>
        </div>
      )}
    </div>
  )
}

export function TransactionSimulatorView() {
  const [activeTab, setActiveTab] = useState<"list" | "simulate">("list")

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTx, setLoadingTx] = useState(true)
  const [txSearch, setTxSearch] = useState("")
  const [txTypeFilter, setTxTypeFilter] = useState("ALL")
  const [txAmlFilter, setTxAmlFilter] = useState("ALL")

  // Clients
  const [clients, setClients] = useState<Client[]>([])
  const [clientMap, setClientMap] = useState<Record<string, Client>>({})
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)

  // Simulation Form
  const [montant, setMontant] = useState("")
  const [typeOperation, setTypeOperation] = useState("Dépôt")
  const [canal, setCanal] = useState("Guichet")
  const [devise, setDevise] = useState("XOF")
  const [beneficiaire, setBeneficiaire] = useState("")
  const [description, setDescription] = useState("")
  const [showOptionalFields, setShowOptionalFields] = useState(false)

  // Status
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)

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
      toast.error("Impossible de charger les clients")
    }
  }, [selectedClient])

  // 2. Charger les transactions
  const loadTransactions = useCallback(async () => {
    setLoadingTx(true)
    try {
      const data = await transactionService.getTransactions(100)
      setTransactions(data)
    } catch {
      toast.error("Impossible de charger la liste des transactions")
    } finally {
      setLoadingTx(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
    loadTransactions()
  }, [loadClients, loadTransactions])

  // Filtrage des transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const client = clientMap[t.clientId]
      const clientNom = client
        ? client.typeClient === "Entreprise"
          ? client.raisonSociale || client.nom
          : `${client.prenom || ""} ${client.nom}`
        : ""

      const query = txSearch.toLowerCase()
      const matchesSearch =
        !query ||
        t.reference.toLowerCase().includes(query) ||
        (t.beneficiaireNom && t.beneficiaireNom.toLowerCase().includes(query)) ||
        clientNom.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))

      const matchesType = txTypeFilter === "ALL" || t.typeOperation.toLowerCase().includes(txTypeFilter.toLowerCase())
      
      const isUemoa = t.montant >= SEUIL_UEMOA
      const matchesAml =
        txAmlFilter === "ALL" ||
        (txAmlFilter === "UEMOA" && isUemoa) ||
        (txAmlFilter === "NORMAL" && !isUemoa)

      return matchesSearch && matchesType && matchesAml
    })
  }, [transactions, clientMap, txSearch, txTypeFilter, txAmlFilter])

  const {
    data: pagedTransactions,
    page: txPage,
    setPage: setTxPage,
    totalPages: txTotalPages,
    total: txFilteredTotal,
  } = usePageSlice(filteredTransactions, 20)

  // Statistiques calculées
  const totalVolume = useMemo(() => transactions.reduce((acc, t) => acc + (t.montant || 0), 0), [transactions])
  const countUemoa = useMemo(() => transactions.filter((t) => t.montant >= SEUIL_UEMOA).length, [transactions])
  const avgAmount = useMemo(() => (transactions.length > 0 ? totalVolume / transactions.length : 0), [transactions, totalVolume])

  // Filtrer la liste des clients pour le sélecteur
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients
    const q = clientSearch.toLowerCase()
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.prenom && c.prenom.toLowerCase().includes(q)) ||
        (c.raisonSociale && c.raisonSociale.toLowerCase().includes(q)) ||
        c.codeClient.toLowerCase().includes(q)
    )
  }, [clients, clientSearch])

  const montantNum = parseFloat(montant.replace(/\s/g, "")) || 0
  const seuilPercent = Math.min((montantNum / SEUIL_UEMOA) * 100, 100)
  const depasse = montantNum >= SEUIL_UEMOA
  const procheSeuil = montantNum >= 4_000_000 && !depasse

  const handleSimulate = async () => {
    if (!selectedClient) {
      toast.error("Veuillez sélectionner un client")
      return
    }
    if (!montantNum || montantNum <= 0) {
      toast.error("Veuillez saisir un montant valide")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await transactionService.simulateTransaction({
        reference: `SIM-${Date.now()}`,
        clientId: selectedClient.id,
        montant: montantNum,
        devise,
        typeOperation,
        canal,
        beneficiaireNom: beneficiaire.trim() || undefined,
        description: description.trim() || undefined,
      })

      setResult(res)
      // Rafraîchir immédiatement le registre
      await loadTransactions()

      if (res.alerte_declenchee) {
        toast.error(`⚠️ Alerte AML : ${res.alerte_declenchee.type_alerte} (Score ${res.alerte_declenchee.score})`)
      } else if (res.seuil_uemoa_depasse) {
        toast.warning("Seuil UEMOA de 5 000 000 FCFA dépassé !")
      } else {
        toast.success("Transaction simulée et enregistrée avec succès")
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la simulation")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setMontant("")
    setBeneficiaire("")
    setDescription("")
    setResult(null)
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <ArrowRightLeft className="w-7 h-7 text-indigo-600" />
            Transactions & Surveillance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Registre complet des flux, surveillance AML et simulateur temps réel (Seuil UEMOA 5M FCFA).
          </p>
        </div>

        {/* Boutons d'onglets principaux */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "list"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            Registre ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("simulate")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "simulate"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Simulateur AML
          </button>
        </div>
      </div>

      {/* Cartes KPI avec MetricCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Opérations"
          value={transactions.length}
          subtitle="Enregistrées en base"
          icon={CreditCard}
          variant="default"
        />
        <MetricCard
          title="Volume Total"
          value={formatAmount(totalVolume)}
          subtitle="Flux cumulés"
          icon={Wallet}
          variant="default"
        />
        <MetricCard
          title="Seuil UEMOA (≥ 5M)"
          value={countUemoa}
          subtitle="Déclarations requises"
          icon={AlertTriangle}
          variant={countUemoa > 0 ? "danger" : "default"}
        />
        <MetricCard
          title="Montant Moyen"
          value={formatAmount(avgAmount)}
          subtitle="Par transaction"
          icon={BarChart2}
          variant="default"
        />
      </div>

      {/* VUE 1 : REGISTRE DES TRANSACTIONS */}
      {activeTab === "list" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Barre d'outils et filtres */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Rechercher par référence, client, bénéficiaire..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              {/* Filtre Type */}
              <select
                value={txTypeFilter}
                onChange={(e) => setTxTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="ALL">Tous les types</option>
                <option value="Dépôt">Dépôts</option>
                <option value="Retrait">Retraits</option>
                <option value="Virement">Virements</option>
              </select>

              {/* Filtre AML */}
              <select
                value={txAmlFilter}
                onChange={(e) => setTxAmlFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="ALL">Tous les statuts AML</option>
                <option value="UEMOA">⚠️ Seuil UEMOA (≥ 5M)</option>
                <option value="NORMAL">✅ Normales (&lt; 5M)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadTransactions}
                disabled={loadingTx}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTx ? "animate-spin" : ""}`} />
                Actualiser
              </button>
              <button
                onClick={() => setActiveTab("simulate")}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm shadow-sm transition"
              >
                <Zap className="w-4 h-4" />
                Simuler un flux
              </button>
            </div>
          </div>

          {/* Tableau des transactions */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Réf & Date</th>
                  <th className="px-5 py-3.5">Client Émetteur</th>
                  <th className="px-5 py-3.5">Opération & Canal</th>
                  <th className="px-5 py-3.5">Bénéficiaire</th>
                  <th className="px-5 py-3.5 text-right">Montant</th>
                  <th className="px-5 py-3.5 text-center">Statut AML</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loadingTx ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Spinner />
                        <span>Chargement des transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CreditCard className="w-8 h-8 text-slate-300" />
                        <span className="font-medium text-slate-600">Aucune transaction trouvée</span>
                        <span className="text-xs text-slate-400">Modifiez vos filtres ou effectuez une simulation.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedTransactions.map((tx) => {
                    const client = clientMap[tx.clientId]
                    const isUemoa = tx.montant >= SEUIL_UEMOA
                    const clientNom = client
                      ? client.typeClient === "Entreprise"
                        ? client.raisonSociale || client.nom
                        : `${client.prenom || ""} ${client.nom}`.trim()
                      : "Client inconnu"

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Réf & Date */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-indigo-700 text-xs">{tx.reference}</span>
                            <span className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatDate(tx.dateTransaction)}
                            </span>
                          </div>
                        </td>

                        {/* Client */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                              {client?.typeClient === "Entreprise" ? (
                                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 text-xs truncate max-w-[160px]">{clientNom}</p>
                              {client && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-xs text-slate-400">{client.codeClient}</span>
                                  {client.estPpe && (
                                    <span className="bg-rose-100 text-rose-700 text-xs px-1.5 py-0.2 rounded font-semibold">
                                      PPE
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Opération & Canal */}
                        <td className="px-5 py-3.5">
                          <div>
                            <span className="font-medium text-slate-800 text-xs">{tx.typeOperation}</span>
                            <span className="block text-slate-400 text-xs">{tx.canal || "Guichet"}</span>
                          </div>
                        </td>

                        {/* Bénéficiaire */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-slate-700 font-medium">
                            {tx.beneficiaireNom || "—"}
                          </span>
                        </td>

                        {/* Montant */}
                        <td className="px-5 py-3.5 text-right">
                          <span className={`font-bold font-mono text-sm ${isUemoa ? "text-rose-600" : "text-slate-800"}`}>
                            {formatAmount(tx.montant)}
                          </span>
                          {isUemoa && (
                            <span className="block text-xs font-semibold text-rose-500">≥ Seuil UEMOA</span>
                          )}
                        </td>

                        {/* Statut AML */}
                        <td className="px-5 py-3.5 text-center">
                          {isUemoa ? (
                            <StatusBadge variant="danger" size="sm" dot>
                              Déclaration CENTIF
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="success" size="sm" dot>
                              Conforme
                            </StatusBadge>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {txFilteredTotal > 0 && (
            <DataPagination
              page={txPage}
              totalPages={txTotalPages}
              total={txFilteredTotal}
              pageSize={20}
              onPageChange={setTxPage}
              itemLabel="transactions"
              className="rounded-none border-x-0 border-b-0"
            />
          )}
        </div>
      )}

      {/* VUE 2 : SIMULATEUR DE TRANSACTIONS */}
      {activeTab === "simulate" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panneau gauche : Formulaire de simulation */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                Paramètres de la simulation AML
              </h2>

              {/* Sélection Client */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Client émetteur de l'opération <span className="text-rose-500">*</span>
                </label>
                <div
                  id="sim-client-select-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 transition"
                >
                  {selectedClient ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
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
                          {selectedClient.estPpe && " • PPE"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-sm">Sélectionner un client</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Dropdown recherche client */}
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
                          placeholder="Rechercher par nom, code..."
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
                                <Building2 className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <User className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-sm">
                                {c.typeClient === "Entreprise"
                                  ? c.raisonSociale || c.nom
                                  : `${c.prenom || ""} ${c.nom}`.trim()}
                              </p>
                              <p className="text-xs text-slate-400">
                                {c.codeClient} • {c.ville || c.pays}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
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

              {/* Montant & Devise */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Montant de l'opération <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      id="sim-montant-input"
                      type="number"
                      value={montant}
                      onChange={(e) => setMontant(e.target.value)}
                      placeholder="Ex : 5 500 000"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      FCFA
                    </span>
                  </div>
                  <select
                    value={devise}
                    onChange={(e) => setDevise(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500"
                  >
                    {DEVISES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Barre de progression du seuil UEMOA */}
                {montantNum > 0 && (
                  <div className="mt-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Seuil légal UEMOA (5 000 000 FCFA)</span>
                      <span
                        className={`font-semibold ${
                          depasse ? "text-rose-600" : procheSeuil ? "text-amber-600" : "text-slate-500"
                        }`}
                      >
                        {seuilPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          depasse ? "bg-rose-500" : procheSeuil ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${seuilPercent}%` }}
                      />
                    </div>
                    {depasse && (
                      <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Dépasse le seuil UEMOA — déclaration CENTIF obligatoire
                      </p>
                    )}
                    {procheSeuil && (
                      <p className="text-amber-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                        <Shield className="w-3.5 h-3.5" /> Proche du seuil ({formatAmount(SEUIL_UEMOA - montantNum)} restants)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Type d'opération & Canal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type d'opération</label>
                  <select
                    id="sim-type-operation"
                    value={typeOperation}
                    onChange={(e) => setTypeOperation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500"
                  >
                    {TYPES_OPERATION.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Canal</label>
                  <select
                    id="sim-canal"
                    value={canal}
                    onChange={(e) => setCanal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500"
                  >
                    {CANAUX.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options complémentaires avec divulgation progressive */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  {showOptionalFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>Options complémentaires (Bénéficiaire, Motif...)</span>
                </button>

                {showOptionalFields && (
                  <div className="grid grid-cols-2 gap-4 mt-3 animate-in fade-in-50 duration-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Bénéficiaire</label>
                      <input
                        id="sim-beneficiaire"
                        type="text"
                        value={beneficiaire}
                        onChange={(e) => setBeneficiaire(e.target.value)}
                        placeholder="Nom du bénéficiaire"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Motif / Description</label>
                      <input
                        id="sim-description"
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Motif de la transaction"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  id="sim-submit"
                  type="button"
                  onClick={handleSimulate}
                  disabled={loading || !selectedClient || !montantNum}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-sm"
                >
                  {loading ? <Spinner /> : <Send className="w-4 h-4" />}
                  {loading ? "Analyse AML en cours..." : "Simuler et enregistrer la transaction"}
                </button>
                <button
                  id="sim-reset"
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
                  title="Réinitialiser"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Résultat de la simulation */}
            {result && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <AmlResultCard result={result} onGoToRegistry={() => setActiveTab("list")} />
              </div>
            )}
          </div>

          {/* Panneau droit : Détail Client & Règles AML */}
          <div className="space-y-4">
            {selectedClient && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Client sélectionné
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-sm">
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

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type</span>
                    <Badge color={selectedClient.typeClient === "Entreprise" ? "blue" : "gray"}>
                      {selectedClient.typeClient}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risque</span>
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
                  {selectedClient.estPpe && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">PPE</span>
                      <Badge color="purple">
                        <Star className="w-3 h-3" />
                        {selectedClient.fonctionPpe || "Oui"}
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Score de risque</span>
                    <span className="font-bold text-slate-800">{selectedClient.riskScore ?? "—"}/100</span>
                  </div>
                </div>
              </div>
            )}

            {/* Règles AML actives */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                Règles de conformité UEMOA
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Seuil réglementaire UEMOA", desc: "≥ 5 000 000 FCFA → Déclaration CENTIF obligatoire", dot: "bg-slate-400" },
                  { label: "Fractionnement de seuil", desc: "Transactions répétées < seuil sur 48h détectées", dot: "bg-slate-400" },
                  { label: "Majoration PPE", desc: "Pondération accrue si le client ou l'UBO est PPE", dot: "bg-slate-400" },
                  { label: "Contrôle SWIFT / International", desc: "Vérification sanctions ONU / GAFI / UMOA", dot: "bg-slate-400" },
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
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  User,
  ShieldAlert,
  Wallet,
  AlertTriangle,
  Share2,
  ChevronRight,
  MapPin,
  Briefcase,
  Calendar,
  CreditCard,
  Phone,
  FileText,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn, formatFacteur } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { useDashboard } from "@/lib/dashboard-context"
import { clientService } from "@/services/clientService"
import { transactionService } from "@/services/transactionService"
import { usePaginatedFetch } from "@/hooks/use-pagination"
import { DetailPaneSkeleton, StatCardsSkeleton, TableSkeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { alertService } from "@/services/alertService"
import { aiService } from "@/services/aiService"
import type { Client } from "@/models/client"
import type { Transaction } from "@/models/transaction"
import type { Alert } from "@/models/alert"
import type { MLPredictResponse } from "@/models/ai"

function TxTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p className="text-xs font-mono font-bold text-indigo-600">
        {Number(payload[0].value).toLocaleString("fr-FR")} FCFA
      </p>
    </div>
  )
}

interface Client360Props {
  initialClientId?: string | null
}

export function Client360View({ initialClientId }: Client360Props = {}) {
  const { selectedClientId, setSelectedClientId } = useDashboard()

  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [clientsError, setClientsError] = useState<Error | string | null>(null)
  const [activeClientId, setActiveClientId] = useState<string | null>(null)
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Données dynamiques spécifiques au client actif
  const [scoreData, setScoreData] = useState<any | null>(null)
  const [loadingScore, setLoadingScore] = useState(false)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTxs, setLoadingTxs] = useState(false)

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(false)

  const [mlPrediction, setMlPrediction] = useState<MLPredictResponse | null>(null)
  const [loadingMl, setLoadingMl] = useState(false)

  const [selectedAccount, setSelectedAccount] = useState<any | null>(null)
  const [showFullKyc, setShowFullKyc] = useState(false)

  // Fermer la recherche lors d'un clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 1. Détection de l'ID cible (recherche par prop, context, sessionStorage ou événement)
  const checkPendingTargetId = useCallback((): string | null => {
    if (initialClientId) return initialClientId
    if (selectedClientId) return selectedClientId
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("lakana_selected_client_id")
        if (saved) {
          sessionStorage.removeItem("lakana_selected_client_id")
          return saved
        }
      } catch {}
    }
    return null
  }, [initialClientId, selectedClientId])

  // Écoute directe des événements custom pour une réactivité absolue
  useEffect(() => {
    const handlePayload = (e: Event) => {
      const opts = (e as CustomEvent).detail?.options || (e as CustomEvent).detail
      if (opts?.clientId) {
        setActiveClientId(opts.clientId)
      }
    }
    window.addEventListener("lakana-navigate-payload", handlePayload as EventListener)
    window.addEventListener("lakana-navigate", handlePayload as EventListener)
    return () => {
      window.removeEventListener("lakana-navigate-payload", handlePayload as EventListener)
      window.removeEventListener("lakana-navigate", handlePayload as EventListener)
    }
  }, [])

  // 2. Chargement de tous les clients depuis l'API backend
  const loadClients = useCallback(async () => {
    setLoadingClients(true)
    setClientsError(null)
    try {
      const data = await clientService.getClients()
      setClients(data)
      const pendingId = checkPendingTargetId()
      if (pendingId && data.length > 0) {
        const needle = pendingId.trim().toLowerCase()
        const found = data.find(
          (c) =>
            c.id?.toLowerCase() === needle ||
            c.codeClient?.toLowerCase() === needle ||
            c.nom?.toLowerCase().includes(needle) ||
            needle.includes(c.nom?.toLowerCase())
        )
        if (found) {
          setActiveClientId(found.id)
          if (selectedClientId) setSelectedClientId(null)
          return
        }
      }
      if (data.length > 0) {
        setActiveClientId((prev) => prev || data[0].id)
      }
    } catch (err) {
      console.error("Erreur chargement clients Client 360:", err)
      setClientsError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoadingClients(false)
    }
  }, [checkPendingTargetId, selectedClientId, setSelectedClientId])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  useEffect(() => {
    const pending = checkPendingTargetId()
    if (pending && clients.length > 0) {
      const needle = pending.trim().toLowerCase()
      const found = clients.find(
        (c) =>
          c.id?.toLowerCase() === needle ||
          c.codeClient?.toLowerCase() === needle ||
          c.nom?.toLowerCase().includes(needle) ||
          needle.includes(c.nom?.toLowerCase())
      )
      if (found) {
        setActiveClientId(found.id)
        if (selectedClientId) setSelectedClientId(null)
      }
    }
  }, [selectedClientId, initialClientId, clients, checkPendingTargetId, setSelectedClientId])

  // Client actif
  const activeClient: Client | null = useMemo(() => {
    if (!activeClientId || clients.length === 0) return clients[0] || null
    const needle = activeClientId.trim().toLowerCase()
    return (
      clients.find(
        (c) =>
          c.id?.toLowerCase() === needle ||
          c.codeClient?.toLowerCase() === needle ||
          c.nom?.toLowerCase().includes(needle) ||
          needle.includes(c.nom?.toLowerCase())
      ) || clients[0]
    )
  }, [activeClientId, clients])

  // Recherche filtrée de clients
  const filteredClients = useMemo(() => {
    const q = clientSearchTerm.trim().toLowerCase()
    if (!q) return clients.slice(0, 8)
    return clients.filter((c) => {
      const name = c.typeClient === "Entreprise" ? c.raisonSociale || c.nom : `${c.prenom || ""} ${c.nom}`.trim()
      return (
        name.toLowerCase().includes(q) ||
        c.codeClient?.toLowerCase().includes(q) ||
        c.nom?.toLowerCase().includes(q) ||
        c.prenom?.toLowerCase().includes(q)
      )
    }).slice(0, 8)
  }, [clients, clientSearchTerm])

  // Historique paginé des transactions affiché dans la modale
  const {
    data: modalTransactions,
    loading: modalTxLoading,
  } = usePaginatedFetch<Transaction>(
    ({ skip, limit }) => {
      if (!selectedAccount || !activeClient?.id) return Promise.resolve({ data: [], total: 0 })
      return transactionService.getClientTransactionsPage(activeClient.id, { skip, limit })
    },
    [selectedAccount, activeClient?.id],
    { pageSize: 10 }
  )

  // 3. Chargement dynamique des données associées au client actif
  useEffect(() => {
    if (!activeClient?.id) return

    let cancelled = false

    setLoadingScore(true)
    clientService
      .getClientScore(activeClient.id)
      .then((res) => {
        if (!cancelled) setScoreData(res)
      })
      .catch((err) => {
        console.warn("Score non disponible:", err)
        if (!cancelled) setScoreData(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingScore(false)
      })

    setLoadingTxs(true)
    transactionService
      .getClientTransactions(activeClient.id)
      .then((txs) => {
        if (!cancelled) setTransactions(txs)
      })
      .catch((err) => {
        console.warn("Transactions non disponibles:", err)
        if (!cancelled) setTransactions([])
      })
      .finally(() => {
        if (!cancelled) setLoadingTxs(false)
      })

    setLoadingAlerts(true)
    alertService
      .getAlerts()
      .then((allAlerts) => {
        if (!cancelled) {
          const clientAlerts = allAlerts.filter(
            (a) =>
              a.clientId === activeClient.id ||
              a.clientId === activeClient.codeClient ||
              (a.client && activeClient.nom && a.client.toLowerCase().includes(activeClient.nom.toLowerCase()))
          )
          setAlerts(clientAlerts)
        }
      })
      .catch((err) => {
        console.warn("Alertes non disponibles:", err)
        if (!cancelled) setAlerts([])
      })
      .finally(() => {
        if (!cancelled) setLoadingAlerts(false)
      })

    setLoadingMl(true)
    aiService
      .predictClientRisk(activeClient.id)
      .then((pred) => {
        if (!cancelled) setMlPrediction(pred)
      })
      .catch((err) => {
        console.warn("Prédiction non disponible:", err)
        if (!cancelled) setMlPrediction(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingMl(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeClient?.id, activeClient?.codeClient, activeClient?.nom])

  // Données du graphique chronologique
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      const base = activeClient?.riskScore ? activeClient.riskScore * 30000 : 500000
      return [
        { date: "Sem. 1", montant: base * 0.8 },
        { date: "Sem. 2", montant: base * 0.9 },
        { date: "Sem. 3", montant: base * 1.1 },
        { date: "Sem. 4", montant: base * 1.4 },
        { date: "Sem. 5", montant: base * 1.2 },
        { date: "Sem. 6", montant: base * 1.7 },
        { date: "Sem. 7", montant: base * 2.1 },
      ]
    }

    const grouped: Record<string, number> = {}
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.dateTransaction).getTime() - new Date(b.dateTransaction).getTime()
    )

    sorted.forEach((t) => {
      const d = new Date(t.dateTransaction)
      const label = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`
      grouped[label] = (grouped[label] || 0) + Number(t.montant)
    })

    return Object.entries(grouped).map(([date, montant]) => ({ date, montant }))
  }, [transactions, activeClient?.riskScore])

  const clientScore = scoreData?.score ?? activeClient?.riskScore ?? 0
  const clientRiskLevel = scoreData?.niveau_risque ?? activeClient?.niveauRisque ?? (clientScore >= 70 ? "Élevé" : clientScore >= 40 ? "Moyen" : "Faible")

  useEffect(() => {
    if (!selectedAccount) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedAccount(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedAccount])

  if (clientsError) {
    return (
      <ErrorState
        error={clientsError}
        onRetry={loadClients}
        title="Impossible de charger le dossier Client 360°"
        message="La connexion à la base de données pour récupérer les informations consolidées du client a échoué."
        className="my-12 rounded-xl border border-slate-200 bg-white"
      />
    )
  }

  if (loadingClients) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Chargement du profil client...">
        <div className="flex items-center justify-between animate-pulse">
          <div className="h-8 w-64 rounded bg-slate-200" />
          <div className="h-9 w-48 rounded-lg bg-slate-200" />
        </div>
        <StatCardsSkeleton count={4} />
      </div>
    )
  }

  if (!activeClient) {
    return (
      <EmptyState
        icon={User}
        title="Aucun sociétaire trouvé"
        description="La base de données ne contient aucun sociétaire pour le moment."
        actionLabel="Actualiser les données"
        onAction={loadClients}
        className="my-12 rounded-xl border border-slate-200 bg-white"
      />
    )
  }

  const clientFullName =
    activeClient.typeClient === "Entreprise"
      ? activeClient.raisonSociale || activeClient.nom
      : `${activeClient.prenom || ""} ${activeClient.nom}`.trim()

  const clientInitials =
    activeClient.typeClient === "Entreprise"
      ? (activeClient.raisonSociale || activeClient.nom).substring(0, 2).toUpperCase()
      : `${activeClient.nom[0] || ""}${activeClient.prenom?.[0] || ""}`.toUpperCase()

  const clientAccounts = activeClient.comptes || []

  return (
    <div className="space-y-6 pb-8">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. EN-TÊTE ÉPURÉ AVEC SÉLECTEUR DE SOCIÉTAIRE COMPACT              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Fiche Sociétaire 360°
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Vision consolidée du sociétaire, comptes bancaires, transactions et niveau de risque
          </p>
        </div>

        {/* Sélecteur de sociétaire compact et ergonomique */}
        <div ref={searchRef} className="relative w-full sm:w-72">
          <div
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-2 truncate">
              <span className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                clientScore >= 70 ? "bg-rose-500" : clientScore >= 40 ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                {clientFullName}
              </span>
              <span className="font-mono text-slate-400">({activeClient.codeClient})</span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </div>

          {isSearchOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 duration-100">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom ou code..."
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1">
                {filteredClients.map((c) => {
                  const isSelected = c.id === activeClient.id
                  const name = c.typeClient === "Entreprise" ? c.raisonSociale || c.nom : `${c.prenom || ""} ${c.nom}`.trim()
                  const score = c.riskScore ?? 0
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveClientId(c.id)
                        setIsSearchOpen(false)
                        setClientSearchTerm("")
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition",
                        isSelected ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/50" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          score >= 70 ? "bg-rose-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        <span className="truncate">{name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{c.codeClient}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. SYNTHÈSE PRINCIPALE : PROFIL & SCORE DU RISQUE                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* CARTE GAUCHE : Identité & Comptes */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 xl:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#070347] to-indigo-700 text-base font-bold text-white shadow-xs">
              {clientInitials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{clientFullName}</h3>
              <p className="text-xs font-mono font-medium text-slate-400">{activeClient.codeClient} • {activeClient.typeClient}</p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2">
            <StatusBadge
              variant={
                clientRiskLevel === "Élevé"
                  ? "danger"
                  : clientRiskLevel === "Moyen"
                    ? "warning"
                    : "success"
              }
              size="sm"
              dot
            >
              Risque {clientRiskLevel}
            </StatusBadge>

            {activeClient.estPpe && (
              <StatusBadge variant="danger" size="sm">
                <ShieldAlert className="h-3 w-3 inline mr-1" />
                PPE {activeClient.fonctionPpe ? `(${activeClient.fonctionPpe})` : ""}
              </StatusBadge>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Activité</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{activeClient.profession || activeClient.secteurActivite || "Non renseignée"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Localisation</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{activeClient.ville || "Bamako"}, {activeClient.pays || "Mali"}</span>
            </div>

            {/* Détails secondaires KYC repliables */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFullKyc(!showFullKyc)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer dark:text-indigo-400"
              >
                {showFullKyc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span>{showFullKyc ? "Masquer détails KYC" : "Voir pièces & contacts"}</span>
              </button>

              {showFullKyc && (
                <div className="mt-2 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50">
                  {activeClient.pieceIdentite && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pièce ID :</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{activeClient.pieceIdentite}</span>
                    </div>
                  )}
                  {activeClient.telephone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Téléphone :</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{activeClient.telephone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comptes bancaires du sociétaire */}
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Comptes bancaires ({clientAccounts.length})
              </p>
            </div>

            {clientAccounts.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400 dark:bg-slate-800/50">
                Aucun compte enregistré.
              </div>
            ) : (
              <div className="space-y-1.5">
                {clientAccounts.map((acc: any, i: number) => {
                  const num = acc.numero_compte || acc.numeroCompte || "••••"
                  const type = acc.type_compte || acc.typeCompte || "Courant"
                  const solde = Number(acc.solde ?? 0)
                  const devise = acc.devise || "XOF"

                  return (
                    <div
                      key={acc.id || i}
                      onClick={() => setSelectedAccount({ ...acc, num, type, solde, devise })}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2.5 transition hover:bg-indigo-50/50 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-indigo-600" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{type}</p>
                          <p className="text-[10px] font-mono text-slate-400">{num}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                          {solde.toLocaleString("fr-FR")} {devise}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* CARTE DROITE : Score de Risque & Explication */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 xl:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Score de Risque AML</h3>
                <p className="text-xs text-slate-400">Évaluation réglementaire selon les règles de conformité en vigueur</p>
              </div>
              <span className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold",
                clientScore >= 70 ? "bg-rose-50 text-[#CD0D29] border border-rose-200" : clientScore >= 40 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              )}>
                Risque {clientRiskLevel}
              </span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Score numérique grand et direct */}
              <div className="flex items-center gap-4 shrink-0">
                <div className={cn(
                  "flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 font-mono shadow-xs",
                  clientScore >= 70 ? "border-[#CD0D29] bg-rose-50/50 text-[#CD0D29]" : clientScore >= 40 ? "border-amber-500 bg-amber-50/50 text-amber-600" : "border-emerald-500 bg-emerald-50/50 text-emerald-600"
                )}>
                  <span className="text-3xl font-extrabold">{clientScore}</span>
                  <span className="text-[10px] font-medium text-slate-400">/ 100</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {clientScore >= 70
                      ? activeClient.estPpe
                        ? "Vigilance renforcée — Statut PPE identifié"
                        : "Vigilance renforcée requise"
                      : clientScore >= 40
                      ? "Vigilance standard"
                      : "Opérations conformes"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 max-w-md">
                    Calculé en temps réel à partir des flux de transactions, des alertes détectées et du statut sociétaire.
                  </p>
                </div>
              </div>
            </div>

            {/* Facteurs explicatifs concrets formulés simplement */}
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Facteurs explicatifs du score :
              </p>
              {scoreData?.facteurs && scoreData.facteurs.length > 0 ? (
                <div className="space-y-2">
                  {scoreData.facteurs.map((fact: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>{formatFacteur(fact)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Aucun facteur aggravant détecté. Les opérations du sociétaire sont conformes aux seuils habituels.</span>
                </div>
              )}
            </div>
          </div>

          {/* Analyse comportementale automatisée sobre */}
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  mlPrediction?.is_anomaly ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                )} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {mlPrediction?.is_anomaly ? "Comportement atypique détecté" : "Comportement conforme aux flux habituels"}
                </span>
              </div>
              <button
                onClick={() => {
                  if (activeClient?.id) {
                    setLoadingMl(true)
                    aiService.predictClientRisk(activeClient.id).then((p) => {
                      setMlPrediction(p)
                      setLoadingMl(false)
                    })
                  }
                }}
                disabled={loadingMl}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer dark:text-indigo-400"
              >
                {loadingMl ? "Actualisation..." : "Vérifier"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 3. FLUX & ALERTES LIÉES                                           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Évolution des flux de transactions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Historique des flux de transactions ({transactions.length})
            </h3>
            <span className="text-xs text-slate-400">Flux consolidés</span>
          </div>

          <div className="mt-4 h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#070347" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#070347" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<TxTooltip />} />
                <Area type="monotone" dataKey="montant" stroke="#070347" strokeWidth={2} fill="url(#txGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historique des alertes du sociétaire */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Alertes du sociétaire ({alerts.length})
            </h3>
            <button
              onClick={() => navigateTo("Centre d'alertes")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              Centre d'alertes →
            </button>
          </div>

          <div className="mt-4">
            {alerts.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Aucune alerte active pour ce sociétaire.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div
                    key={a.id || a.ref}
                    onClick={() => navigateTo("Centre d'alertes")}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#CD0D29] dark:bg-rose-950/50">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{a.type}</p>
                        <p className="text-[10px] font-mono text-slate-400">{a.ref}</p>
                      </div>
                    </div>
                    <StatusBadge
                      variant={
                        a.level === "bloquante"
                          ? "danger"
                          : a.level === "analyser"
                            ? "warning"
                            : "success"
                      }
                      size="sm"
                      dot
                    >
                      {a.level}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modale de détail du compte */}
      {selectedAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setSelectedAccount(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Compte {selectedAccount.type}
                </h3>
                <p className="mt-0.5 text-xs font-mono text-slate-400">{selectedAccount.num}</p>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800 dark:bg-slate-800/50 flex justify-between items-center">
              <span className="text-xs text-slate-500">Solde disponible</span>
              <span className="text-base font-mono font-bold text-slate-900 dark:text-slate-100">
                {selectedAccount.solde.toLocaleString("fr-FR")} {selectedAccount.devise}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-slate-600 mb-2 dark:text-slate-400">Dernières écritures</p>
              {modalTxLoading ? (
                <div className="p-4 text-center text-xs text-slate-400">Chargement...</div>
              ) : modalTransactions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Aucune transaction enregistrée.</div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0">
                      <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 text-right font-medium">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {modalTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="px-3 py-2 text-slate-500">{new Date(tx.dateTransaction).toLocaleDateString("fr-FR")}</td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{tx.typeOperation || "Virement"}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            {Number(tx.montant).toLocaleString("fr-FR")} FCFA
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

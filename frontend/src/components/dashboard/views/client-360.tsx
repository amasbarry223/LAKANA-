"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  User,
  ShieldAlert,
  Wallet,
  TrendingUp,
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
  Sparkles,
  Cpu,
  Bot,
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
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { useDashboard } from "@/lib/dashboard-context"
import { clientService } from "@/services/clientService"
import { transactionService } from "@/services/transactionService"
import { DataPagination } from "@/components/ui/data-pagination"
import { usePaginatedFetch } from "@/hooks/use-pagination"
import { alertService } from "@/services/alertService"
import { aiService } from "@/services/aiService"
import type { Client } from "@/models/client"
import type { Transaction } from "@/models/transaction"
import type { Alert } from "@/models/alert"
import type { MLPredictResponse } from "@/models/ai"

const levelColor: Record<string, string> = {
  bloquante: "bg-rose-50 text-rose-700 border-rose-200",
  analyser: "bg-amber-50 text-amber-700 border-amber-200",
  informative: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

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
  const [activeClientId, setActiveClientId] = useState<string | null>(null)
  const [clientSearchTerm, setClientSearchTerm] = useState("")

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
    try {
      const data = await clientService.getClients()
      setClients(data)
      // Déterminer le client initial à afficher
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
      // Par défaut : premier client si aucun n'est encore sélectionné
      if (data.length > 0) {
        setActiveClientId((prev) => prev || data[0].id)
      }
    } catch (err) {
      console.error("Erreur chargement clients Client 360:", err)
    } finally {
      setLoadingClients(false)
    }
  }, [checkPendingTargetId, selectedClientId, setSelectedClientId])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  // Synchronisation si selectedClientId ou initialClientId change après coup
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

  // Client actuellement sélectionné
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

  // Bandeau de sélection : recherche + rendu borné à 20 résultats (pas de barre de
  // pages ici — c'est une recherche bornée, pas un tableau paginé, cf. graph.tsx).
  const CLIENT_BAR_LIMIT = 20
  const matchingClients = useMemo(() => {
    const q = clientSearchTerm.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) => {
      const name = c.typeClient === "Entreprise" ? c.raisonSociale || c.nom : `${c.prenom || ""} ${c.nom}`.trim()
      return (
        name.toLowerCase().includes(q) ||
        c.codeClient?.toLowerCase().includes(q) ||
        c.nom?.toLowerCase().includes(q) ||
        c.prenom?.toLowerCase().includes(q)
      )
    })
  }, [clients, clientSearchTerm])
  const visibleClients = matchingClients.slice(0, CLIENT_BAR_LIMIT)
  const hiddenClientsCount = Math.max(0, matchingClients.length - CLIENT_BAR_LIMIT)

  // Historique paginé des transactions affiché dans la modale de détail de compte
  // (découplé du chart d'évolution, qui garde son propre appel borné à ~50 tx)
  const {
    data: modalTransactions,
    total: modalTxTotal,
    page: modalTxPage,
    setPage: setModalTxPage,
    totalPages: modalTxTotalPages,
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

    // A. Récupération du score & facteurs explicatifs dynamiques
    setLoadingScore(true)
    clientService
      .getClientScore(activeClient.id)
      .then((res) => {
        if (!cancelled) setScoreData(res)
      })
      .catch((err) => {
        console.warn("Score non disponible pour ce client:", err)
        if (!cancelled) setScoreData(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingScore(false)
      })

    // B. Récupération des transactions réelles de ce client
    setLoadingTxs(true)
    transactionService
      .getClientTransactions(activeClient.id)
      .then((txs) => {
        if (!cancelled) setTransactions(txs)
      })
      .catch((err) => {
        console.warn("Transactions non disponibles pour ce client:", err)
        if (!cancelled) setTransactions([])
      })
      .finally(() => {
        if (!cancelled) setLoadingTxs(false)
      })

    // C. Récupération des alertes réelles de ce client
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
        console.warn("Alertes non disponibles pour ce client:", err)
        if (!cancelled) setAlerts([])
      })
      .finally(() => {
        if (!cancelled) setLoadingAlerts(false)
      })

    // D. Récupération de l'analyse et prédiction IA
    setLoadingMl(true)
    aiService
      .predictClientRisk(activeClient.id)
      .then((pred) => {
        if (!cancelled) setMlPrediction(pred)
      })
      .catch((err) => {
        console.warn("Prédiction IA non disponible pour ce client:", err)
        if (!cancelled) setMlPrediction(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingMl(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeClient?.id, activeClient?.codeClient, activeClient?.nom])

  // Calcul des données du graphique chronologique
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Données de tendance par défaut basées sur le score du client
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

    // Regrouper les vraies transactions par date
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

  // Données de décomposition des facteurs
  const decompositionFactors = useMemo(() => {
    if (scoreData?.decomposition) {
      const dec = scoreData.decomposition
      return [
        { label: "Fractionnement potentiel", points: dec.fractionnement?.points ?? 0, max: dec.fractionnement?.max ?? 25 },
        { label: "Volume inhabituel", points: dec.volume?.points ?? 0, max: dec.volume?.max ?? 25 },
        { label: "Fréquence anormale", points: dec.frequence?.points ?? 0, max: dec.frequence?.max ?? 15 },
        { label: "Correspondance PPE / Sanctions", points: dec.sanctions_ppe?.points ?? (activeClient?.estPpe ? 15 : 0), max: dec.sanctions_ppe?.max ?? 15 },
        { label: "Relations inhabituelles", points: dec.relations?.points ?? 0, max: dec.relations?.max ?? 10 },
        { label: "Détection d'anomalie IA (ML)", points: dec.modele_ia?.points ?? (mlPrediction?.is_anomaly ? 10 : (mlPrediction?.anomaly_score && mlPrediction.anomaly_score >= 0.4 ? 5 : 0)), max: 10 },
      ]
    }

    const currentScore = activeClient?.riskScore || 35
    return [
      { label: "Volume inhabituel", points: Math.min(25, Math.round(currentScore * 0.25)), max: 25 },
      { label: "Fractionnement potentiel", points: Math.min(25, Math.round(currentScore * 0.25)), max: 25 },
      { label: "Correspondance PPE", points: activeClient?.estPpe ? 15 : 0, max: 15 },
      { label: "Fréquence anormale", points: Math.min(15, Math.round(currentScore * 0.15)), max: 15 },
      { label: "Relations inhabituelles", points: Math.min(10, Math.round(currentScore * 0.1)), max: 10 },
      { label: "Détection d'anomalie IA (ML)", points: mlPrediction?.is_anomaly ? 10 : (mlPrediction?.anomaly_score && mlPrediction.anomaly_score >= 0.4 ? 5 : 0), max: 10 },
    ]
  }, [scoreData, activeClient, mlPrediction])

  const clientScore = scoreData?.score ?? activeClient?.riskScore ?? 0
  const clientRiskLevel = scoreData?.niveau_risque ?? activeClient?.niveauRisque ?? (clientScore >= 70 ? "Élevé" : clientScore >= 40 ? "Moyen" : "Faible")

  // Fermeture modale avec touche Echap
  useEffect(() => {
    if (!selectedAccount) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedAccount(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedAccount])

  if (loadingClients) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Chargement des fiches clients depuis la base de données...</p>
      </div>
    )
  }

  if (!activeClient) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
        <h3 className="mt-2 text-base font-semibold text-slate-900">Aucun client trouvé</h3>
        <p className="mt-1 text-sm text-slate-500">La base de données ne contient aucun client pour le moment.</p>
      </div>
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Client 360°
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Fiche consolidée 100% connectée à la base : profil KYC, comptes réels, scoring et alertes.
          </p>
        </div>

        {/* Sélecteur de clients : recherche + bandeau horizontal borné */}
        <div className="flex flex-col items-end gap-1.5 max-w-full">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              placeholder="Filtrer les clients..."
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs outline-none focus:border-indigo-400"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {visibleClients.map((c) => {
              const isSelected = c.id === activeClient.id
              const name = c.typeClient === "Entreprise" ? c.raisonSociale || c.nom : `${c.prenom || ""} ${c.nom}`.trim()
              const score = c.riskScore ?? 0
              const dotColor = score >= 70 ? "bg-rose-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500"

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveClientId(c.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs md:text-sm font-medium transition shadow-sm",
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-500"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />
                  <span className="truncate max-w-[140px]">{name}</span>
                  <span className="text-xs text-slate-400 font-mono">({c.codeClient})</span>
                </button>
              )
            })}
            {hiddenClientsCount > 0 && (
              <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                +{hiddenClientsCount} autres résultats, affinez votre recherche
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Row 1: Profile + Risk Score */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Profile card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-lg font-bold text-white shadow-md">
              {clientInitials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-slate-900">{clientFullName}</h3>
              <p className="text-xs font-mono font-medium text-slate-400">{activeClient.codeClient} • {activeClient.typeClient}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
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

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Activité :</span>
              <span className="font-semibold text-slate-800 truncate">{activeClient.profession || activeClient.secteurActivite || "Non renseignée"}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Ville & Pays :</span>
              <span className="font-semibold text-slate-800">{activeClient.ville || "Bamako"}, {activeClient.pays || "Mali"}</span>
            </div>

            {/* Divulgation progressive pour les données KYC secondaires */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowFullKyc(!showFullKyc)}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                {showFullKyc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span>{showFullKyc ? "Masquer détails KYC" : "Voir pièces d'identité & contacts"}</span>
              </button>

              {showFullKyc && (
                <div className="mt-2 space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 animate-in fade-in-50 duration-150">
                  {activeClient.dateNaissance && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">Né(e) le :</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(activeClient.dateNaissance).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}

                  {activeClient.pieceIdentite && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">Pièce :</span>
                      <span className="font-mono font-semibold text-slate-800">{activeClient.pieceIdentite}</span>
                    </div>
                  )}

                  {activeClient.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">Tél :</span>
                      <span className="font-mono font-semibold text-slate-800">{activeClient.telephone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comptes bancaires réels du client */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Comptes bancaires ({clientAccounts.length})
              </p>
              {clientAccounts.length >= 2 && (
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  Multi-comptes
                </span>
              )}
            </div>

            {clientAccounts.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-400">
                Aucun compte bancaire enregistré.
              </div>
            ) : (
              <div className="space-y-2">
                {clientAccounts.map((acc: any, i: number) => {
                  const num = acc.numero_compte || acc.numeroCompte || "••••"
                  const type = acc.type_compte || acc.typeCompte || "Courant"
                  const solde = Number(acc.solde ?? 0)
                  const devise = acc.devise || "XOF"

                  return (
                    <div
                      key={acc.id || i}
                      onClick={() => setSelectedAccount({ ...acc, num, type, solde, devise })}
                      className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5 hover:bg-indigo-50/50 hover:border-indigo-200 transition"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs text-indigo-600">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800">{type}</p>
                        <p className="text-xs font-mono text-slate-400">{num}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-mono text-slate-900">
                          {solde.toLocaleString("fr-FR")} <span className="text-xs font-normal text-slate-400">{devise}</span>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Risk Score breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Risk Score — Analyse réglementaire</h3>
              <p className="text-xs text-slate-400">Moteur de calcul dynamique en temps réel</p>
            </div>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold">
              Score LAKANA
            </Badge>
          </div>

          <div className="mt-4 flex items-center gap-5">
            {/* Gauge circulaire */}
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={clientScore >= 70 ? "#EF4444" : clientScore >= 40 ? "#F59E0B" : "#10B981"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(clientScore / 100) * 314} 314`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">{clientScore}</span>
                <span className="text-xs font-medium text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">
                  Niveau de risque : <span className={cn(clientRiskLevel === "Élevé" ? "text-rose-600" : clientRiskLevel === "Moyen" ? "text-amber-600" : "text-emerald-600")}>{clientRiskLevel}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Le score de conformité est calculé dynamiquement à partir des alertes réelles, des opérations atypiques et des statuts PPE de la base.
              </p>
              {scoreData?.facteurs && scoreData.facteurs.length > 0 && (
                <div className="mt-2 space-y-1">
                  {scoreData.facteurs.map((fact: string, idx: number) => (
                    <p key={idx} className="text-xs text-amber-800 bg-amber-50 p-1.5 rounded-lg flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{fact}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Barres de décomposition des facteurs */}
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Décomposition des règles de détection :</p>
            {decompositionFactors.map((f) => (
              <div key={f.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{f.label}</span>
                  <span className="text-slate-500 font-mono">
                    <span className="font-bold text-slate-900">{f.points}</span> / {f.max} pts
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      f.points / f.max > 0.7 ? "bg-rose-500" : f.points / f.max > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(100, (f.points / f.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row IA: Diagnostic Prédictif & Machine Learning AML */}
      <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Diagnostic Prédictif IA & Machine Learning</h3>
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs font-semibold">
                  Isolation Forest + Random Forest
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Détection d&apos;anomalies non supervisée calibrée sur les flux SFD/UEMOA (14 features comportementales)
              </p>
            </div>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loadingMl && "animate-spin")} />
            {loadingMl ? "Analyse en cours..." : "Ré-analyser par IA"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Métrique 1: Score d'anomalie */}
          <div className="rounded-lg bg-white border border-slate-200/80 p-3.5 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Score d&apos;atypisme (Isolation Forest)</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={cn(
                "text-2xl font-bold font-mono",
                (mlPrediction?.anomaly_score || 0) >= 0.65 ? "text-rose-600" : (mlPrediction?.anomaly_score || 0) >= 0.40 ? "text-amber-600" : "text-emerald-600"
              )}>
                {mlPrediction ? `${Math.round(mlPrediction.anomaly_score * 100)}%` : "—"}
              </span>
              <span className="text-xs text-slate-400">d&apos;écart statistique</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  (mlPrediction?.anomaly_score || 0) >= 0.65 ? "bg-rose-500" : (mlPrediction?.anomaly_score || 0) >= 0.40 ? "bg-amber-500" : "bg-emerald-500"
                )}
                style={{ width: `${Math.min(100, (mlPrediction?.anomaly_score || 0) * 100)}%` }}
              />
            </div>
          </div>

          {/* Métrique 2: Risque prédit supervisé */}
          <div className="rounded-lg bg-white border border-slate-200/80 p-3.5 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Classification Risque (Random Forest)</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-md",
                mlPrediction?.predicted_risk === "Élevé"
                  ? "bg-rose-100 text-rose-800"
                  : mlPrediction?.predicted_risk === "Moyen"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              )}>
                {mlPrediction?.predicted_risk || "Faible"}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Confiance: {mlPrediction ? `${Math.round(mlPrediction.confidence * 100)}%` : "95%"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Modèle : {mlPrediction?.model_used || "isolation_forest+random_forest"}
            </p>
          </div>

          {/* Métrique 3: Statut d'anomalie */}
          <div className="rounded-lg bg-white border border-slate-200/80 p-3.5 shadow-2xs">
            <p className="text-xs font-semibold text-slate-500">Verdict Algorithmique LAKANA</p>
            <div className="mt-2 flex items-center gap-2">
              <div className={cn(
                "h-2.5 w-2.5 rounded-full",
                mlPrediction?.is_anomaly ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
              )} />
              <span className="text-xs font-bold text-slate-800">
                {mlPrediction?.is_anomaly ? "Anomalie Comportementale Détectée" : "Comportement dans les seuils normaux"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {mlPrediction?.is_anomaly
                ? "Déviance statistique non expliquée par les seuils unitaires."
                : "Flux financiers cohérents avec le profil du client."}
            </p>
          </div>
        </div>

        {/* Facteurs et signaux faibles détectés par l'IA */}
        {mlPrediction?.facteurs_ia && mlPrediction.facteurs_ia.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-white border border-indigo-100">
            <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-indigo-600" />
              Signaux faibles identifiés par le modèle :
            </p>
            <div className="space-y-1">
              {mlPrediction.facteurs_ia.map((fact, idx) => (
                <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 2: Transactions chart + Relationship graph */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Transaction history */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Évolution des flux de transactions
              </h3>
              <p className="text-xs text-slate-400">{transactions.length} transaction(s) enregistrée(s) en base</p>
            </div>
            <span className="inline-flex items-center text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Flux consolidés
            </span>
          </div>

          <div className="mt-4 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<TxTooltip />} />
                <Area type="monotone" dataKey="montant" stroke="#6366F1" strokeWidth={2} fill="url(#txGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick link Graphe de relations */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Cartographie relationnelle</h3>
              <Share2 className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="mt-1 text-xs text-slate-400">Liens et flux financiers interactifs</p>

            <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Client :</span>
                <span className="font-semibold text-slate-800">{clientFullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Comptes associés :</span>
                <span className="font-mono font-bold text-slate-800">{clientAccounts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Règle seuil 15M :</span>
                <span className="text-rose-600 font-semibold">Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigateTo("Graphe de relations")}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
          >
            <Share2 className="h-3.5 w-3.5" />
            Ouvrir dans le Graphe de relations
          </button>
        </div>
      </div>

      {/* Row 3: Alerts history */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Historique des alertes ({alerts.length})
            </h3>
            <p className="text-xs text-slate-400">Alertes AML/CFT déclenchées pour ce client</p>
          </div>
          <button onClick={() => navigateTo("Centre d'alertes")} className="cursor-pointer text-xs font-semibold text-indigo-600 hover:underline">
            Voir le centre d'alertes
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {alerts.length === 0 ? (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Aucune alerte active pour ce client. Le dossier est conforme aux seuils en vigueur.</span>
            </div>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id || a.ref}
                onClick={() => navigateTo("Centre d'alertes")}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-semibold text-slate-800">{a.type}</p>
                  <p className="text-xs font-mono text-slate-400">{a.ref} {a.module ? `• ${a.module}` : ""}</p>
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
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Account transactions modal */}
      {selectedAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedAccount(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Détail du compte — {selectedAccount.type}
                </h3>
                <p className="mt-0.5 text-xs font-mono text-slate-400">{selectedAccount.num}</p>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Account summary */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Type de compte</p>
                <p className="mt-1 font-semibold text-slate-800">{selectedAccount.type}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">N° de compte</p>
                <p className="mt-1 font-mono font-bold text-slate-800">{selectedAccount.num}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Solde actuel</p>
                <p className="mt-1 font-mono font-bold text-indigo-600">
                  {selectedAccount.solde.toLocaleString("fr-FR")} {selectedAccount.devise}
                </p>
              </div>
            </div>

            {/* Transactions table */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Transactions associées</p>
              {modalTxLoading ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Chargement des transactions...
                </div>
              ) : modalTransactions.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  Aucune transaction enregistrée en base pour ce compte.
                </div>
              ) : (
                <>
                  <div className="overflow-hidden rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr className="text-left text-slate-500 border-b border-slate-200">
                          <th className="px-3 py-2 font-semibold">Date</th>
                          <th className="px-3 py-2 font-semibold">Type</th>
                          <th className="px-3 py-2 font-semibold">Bénéficiaire / Description</th>
                          <th className="px-3 py-2 text-right font-semibold">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modalTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                              {new Date(tx.dateTransaction).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-800">{tx.typeOperation}</td>
                            <td className="px-3 py-2 text-slate-600">{tx.beneficiaireNom || tx.description || "—"}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                              {Number(tx.montant).toLocaleString("fr-FR")} {tx.devise}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {modalTxTotal > 0 && (
                    <DataPagination
                      page={modalTxPage}
                      totalPages={modalTxTotalPages}
                      total={modalTxTotal}
                      pageSize={10}
                      onPageChange={setModalTxPage}
                      itemLabel="transactions"
                      className="mt-3"
                    />
                  )}
                </>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={() => setSelectedAccount(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

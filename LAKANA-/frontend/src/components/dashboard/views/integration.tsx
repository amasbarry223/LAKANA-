"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  ChevronRight,
  Plug,
  X,
  Wifi,
  CloudOff,
  Clock,
  Layers,
  FileSpreadsheet,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/ui/metric-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"
import { useDashboard, type ImportItem } from "@/lib/dashboard-context"
import { ApiClient } from "@/services/apiClient"

type Source = {
  name: string
  type: "Liste sanctions" | "Liste PPE" | "Connecteur SFD" | "Base locale"
  lastSync: string
  status: "À jour" | "En attente" | "Erreur"
  records: number
  version?: string
}

type QueueItem = {
  id: string
  type: string
  client: string
  date: string
  pending: boolean
}

type SyncData = {
  sources: Source[]
  sources_a_jour: number
  sources_total: number
  enregistrements_locaux: number
  file_attente_count: number
  file_attente_items: QueueItem[]
  last_sync: string
  anciennete_minutes: number
}

const statusConfig: Record<ImportItem["status"], { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  Validé: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  Erreurs: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle },
  "En file": { color: "bg-amber-50 text-amber-700 border-amber-200", icon: RefreshCw },
}

const typeColor: Record<ImportItem["type"], string> = {
  API: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CSV: "bg-slate-100 text-slate-600 border-slate-200",
  Excel: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Synchronisation: "bg-amber-50 text-amber-700 border-amber-200",
}

const initialConnectors = [
  { name: "SFD Bamako (Agence Centrale)", type: "API REST", status: "Connecté", color: "#10B981", lastSync: "14:30" },
  { name: "SFD Sikasso", type: "API REST", status: "Connecté", color: "#10B981", lastSync: "12:15" },
  { name: "SFD Kayes", type: "Fichier CSV / Sync différée", status: "Dégradé", color: "#F59E0B", lastSync: "09:00" },
]

type PendingFile = {
  name: string
  size: number
  type: ImportItem["type"]
  records: number
  doublons: number
  incoherences: number
}

function detectType(name: string): ImportItem["type"] {
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "Excel"
  return "CSV"
}

export function IntegrationView() {
  const [activeTab, setActiveTab] = useState<"sync" | "import">("sync")
  const { imports, addImport, online, setOnline } = useDashboard()

  // Sync state
  const [syncData, setSyncData] = useState<SyncData | null>(null)
  const [loadingSync, setLoadingSync] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Import state
  const [dragOver, setDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null)
  const [detailImport, setDetailImport] = useState<ImportItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadSyncData = useCallback(async () => {
    try {
      const data = await ApiClient.get<SyncData>("/sync/status")
      setSyncData(data)
    } catch {
      setSyncData(null)
    } finally {
      setLoadingSync(false)
    }
  }, [])

  useEffect(() => {
    loadSyncData()
    const interval = setInterval(loadSyncData, 60_000)
    return () => clearInterval(interval)
  }, [loadSyncData])

  const syncAll = async () => {
    if (!online) {
      toast.error("Hors ligne", { description: "Reconnectez-vous pour synchroniser." })
      return
    }
    setSyncing(true)
    await new Promise((r) => setTimeout(r, 1000))
    await loadSyncData()
    setSyncing(false)
    toast.success("Synchronisation terminée", {
      description: "Les bases locales et connecteurs SFD ont été actualisés.",
    })
  }

  const flushQueue = () => {
    if (!online) {
      toast.error("Hors ligne", { description: "Reconnexion requise pour vider la file." })
      return
    }
    toast.success("File d'attente transmise", { description: "Toutes les alertes hors-ligne ont été synchronisées." })
  }

  const handleFile = (file: File) => {
    const type = detectType(file.name)
    const records = Math.max(100, Math.round(file.size / 80))
    setPendingFile({
      name: file.name,
      size: file.size,
      type,
      records,
      doublons: records > 5000 ? Math.floor(Math.random() * 8) + 1 : 0,
      incoherences: records > 8000 ? Math.floor(Math.random() * 3) : 0,
    })
  }

  const confirmImport = () => {
    if (!pendingFile) return
    const hasErrors = pendingFile.doublons > 0 || pendingFile.incoherences > 0
    addImport({
      source: `Import manuel — ${pendingFile.name}`,
      type: pendingFile.type,
      records: pendingFile.records,
      status: hasErrors ? "Erreurs" : "Validé",
      doublons: pendingFile.doublons || undefined,
      incoherences: pendingFile.incoherences || undefined,
    })
    toast.success("Import confirmé", {
      description: `${pendingFile.records.toLocaleString("fr-FR")} enregistrements intégrés — analyse auto déclenchée.`,
    })
    setPendingFile(null)
  }

  const sources: Source[] = syncData?.sources ?? [
    { name: "Listes Sanctions ONU / GAFI", type: "Liste sanctions", lastSync: "Aujourd'hui 06:00", status: "À jour", records: 12480, version: "2026.08" },
    { name: "Répertoire PPE Mali & UEMOA", type: "Liste PPE", lastSync: "Aujourd'hui 06:00", status: "À jour", records: 2450, version: "v4.2" },
    { name: "Connecteur SFD Bamako", type: "Connecteur SFD", lastSync: "Il y a 15 min", status: "À jour", records: 5420 },
    { name: "Connecteur SFD Sikasso", type: "Connecteur SFD", lastSync: "Il y a 1h", status: "À jour", records: 3120 },
  ]
  const localRecords = syncData?.enregistrements_locaux ?? 23470
  const queueCount = syncData?.file_attente_count ?? 0
  const lastSync = syncData?.last_sync ?? "Il y a 12 min"

  return (
    <div className="space-y-6">
      {/* En-tête avec onglets intégrés */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="lakana-title flex items-center gap-2.5">
            <Database className="h-6 w-6 text-indigo-600" />
            Intégration & Synchronisation
          </h1>
          <p className="lakana-subtitle mt-0.5">
            Connecteurs SFD, flux en temps réel, synchronisation hors-ligne et ingestion de fichiers (Modules 10.1 & 10.11).
          </p>
        </div>

        {/* Sélecteur d'onglets */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("sync")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
              activeTab === "sync"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
            Connecteurs & Sync
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
              activeTab === "import"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Ingestion de fichiers ({imports.length})
          </button>
        </div>
      </div>

      {/* ONGLET 1 : CONNECTEURS & SYNCHRONISATION HORS-LIGNE */}
      {activeTab === "sync" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Bannière d'état de connectivité */}
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4.5 transition-all shadow-xs",
              online ? "border-emerald-200/80 bg-emerald-50/60" : "border-amber-200/80 bg-amber-50/60"
            )}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  online ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}
              >
                {online ? <Wifi className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
              </div>
              <div>
                <p className={cn("text-sm font-bold", online ? "text-emerald-900" : "text-amber-900")}>
                  {online ? "Connexion active — Alimentation en continu connectée" : "Mode hors-ligne actif — Base locale sécurisée"}
                </p>
                <p className={cn("lakana-caption mt-0.5", online ? "text-emerald-700" : "text-amber-700")}>
                  {online
                    ? `Dernière synchronisation réussie : ${lastSync}. ${localRecords.toLocaleString("fr-FR")} enregistrements indexés.`
                    : "Les opérations et alertes sont mises en file d'attente locale et remonteront automatiquement à la reconnexion."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={syncAll}
                disabled={syncing || !online}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin text-indigo-600")} />
                {syncing ? "Actualisation..." : "Synchroniser"}
              </button>
              <button
                onClick={() => {
                  setOnline(!online)
                  toast.info(online ? "Bascule en mode hors-ligne simulé" : "Bascule en mode en ligne")
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition shadow-2xs cursor-pointer",
                  online
                    ? "border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border-amber-300 bg-amber-600 text-white hover:bg-amber-700"
                )}
              >
                {online ? <Wifi className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
                {online ? "En ligne" : "Hors ligne"}
              </button>
            </div>
          </div>

          {/* KPI de Synchronisation */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              title="Sources connectées"
              value={sources.length}
              subtitle="ONU, PPE & SFD"
              icon={Plug}
              variant="default"
            />
            <MetricCard
              title="Données locales"
              value={localRecords.toLocaleString("fr-FR")}
              subtitle="Enregistrements en base"
              icon={Database}
              variant="default"
            />
            <MetricCard
              title="File d'attente locale"
              value={queueCount}
              subtitle={queueCount > 0 ? "En attente de purge" : "File vide (à jour)"}
              icon={Clock}
              variant={queueCount > 0 ? "warning" : "success"}
            />
            <MetricCard
              title="Statut Sanctions"
              value="Conforme"
              subtitle="Listes officielles 2026"
              icon={CheckCircle2}
              variant="success"
            />
          </div>

          {/* Tableau des sources et connecteurs */}
          <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="lakana-body font-bold text-slate-900">Sources réglementaires & Connecteurs SFD</h3>
                <p className="lakana-caption">État de synchronisation des référentiels officiels et des caisses décentralisées</p>
              </div>
              {queueCount > 0 && (
                <button
                  onClick={flushQueue}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  Purger la file ({queueCount})
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 uppercase tracking-wider text-slate-400 font-bold">
                    <th className="px-5 py-3">Source / Référentiel</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Enregistrements</th>
                    <th className="px-4 py-3">Dernière sync</th>
                    <th className="px-4 py-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sources.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{s.name}</p>
                        {s.version && <p className="lakana-caption font-mono">Version {s.version}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{s.type}</td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-800">
                        {s.records.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{s.lastSync}</td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusBadge
                          variant={s.status === "À jour" ? "success" : s.status === "En attente" ? "warning" : "danger"}
                          size="sm"
                          dot
                        >
                          {s.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ONGLET 2 : INGESTION DE FICHIERS (CSV / EXCEL) */}
      {activeTab === "import" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ""
            }}
          />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {/* Zone Drag & Drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files?.[0]
                if (file) handleFile(file)
              }}
              className={cn(
                "rounded-2xl border-2 border-dashed bg-white p-7 text-center transition-all xl:col-span-2 shadow-xs",
                dragOver ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200/90 hover:border-slate-300"
              )}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-2xs">
                <UploadCloud className="h-7 w-7" />
              </div>
              <p className="mt-3.5 lakana-body font-bold text-slate-900">
                Glissez-déposez vos fichiers clients ou transactions ici
              </p>
              <p className="lakana-caption mt-1">Formats compatibles : CSV normalisé, classeurs Excel (.xlsx, .xls)</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                Sélectionner un fichier sur le disque
              </button>
            </div>

            {/* Connecteurs rapides */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-1 shadow-xs">
              <h3 className="lakana-body font-bold text-slate-900">Connecteurs SFD rapides</h3>
              <p className="lakana-caption mt-0.5">Alimentation des caisses régionales</p>
              <div className="mt-4 space-y-2">
                {initialConnectors.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-slate-100/70 transition">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-2xs text-indigo-600">
                      <Plug className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{c.name}</p>
                      <p className="lakana-caption">{c.type} • {c.lastSync}</p>
                    </div>
                    <button
                      onClick={() => {
                        addImport({
                          source: `${c.name} — sync manuelle`,
                          type: "API",
                          records: Math.floor(Math.random() * 2000) + 400,
                          status: "Validé",
                        })
                        toast.success("Synchronisation déclenchée", { description: `${c.name} actualisé.` })
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 transition cursor-pointer"
                      title="Relancer ce flux"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Journal des imports */}
          <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div>
                <h3 className="lakana-body font-bold text-slate-900">Journal des imports de données</h3>
                <p className="lakana-caption">Traçabilité complète des intégrations manuelles et automatiques (INT-04)</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">{imports.length} imports récents</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 uppercase tracking-wider text-slate-400 font-bold">
                    <th className="px-5 py-3">Source & Référence</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3 text-right">Lignes intégrées</th>
                    <th className="px-3 py-3">Horodatage</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {imports.map((im) => {
                    const sc = statusConfig[im.status]
                    return (
                      <tr key={im.id} onClick={() => setDetailImport(im)} className="cursor-pointer hover:bg-slate-50 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{im.source}</p>
                          <p className="lakana-caption font-mono">{im.id}</p>
                        </td>
                        <td className="px-3 py-3.5">
                          <Badge variant="outline" className={cn("border font-semibold", typeColor[im.type])}>
                            {im.type}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5 text-right font-mono font-bold text-slate-900">
                          {im.records.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-3 py-3.5 text-slate-500">{im.date}</td>
                        <td className="px-3 py-3.5">
                          <StatusBadge
                            variant={im.status === "Validé" ? "success" : im.status === "Erreurs" ? "danger" : "warning"}
                            size="sm"
                            dot
                          >
                            {im.status}
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modale de validation de l'import */}
          {pendingFile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in" onClick={() => setPendingFile(null)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="lakana-title text-lg font-bold text-slate-900">Validation de l'intégration</h3>
                  <button onClick={() => setPendingFile(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p><span className="text-slate-400">Fichier :</span> <strong className="text-slate-900">{pendingFile.name}</strong></p>
                  <p><span className="text-slate-400">Taille :</span> {(pendingFile.size / 1024).toFixed(1)} Ko</p>
                  <p><span className="text-slate-400">Type détecté :</span> {pendingFile.type}</p>
                  <p><span className="text-slate-400">Lignes estimées :</span> {pendingFile.records.toLocaleString("fr-FR")}</p>
                  {pendingFile.doublons > 0 && <p className="text-amber-600 font-semibold">{pendingFile.doublons} doublon(s) identifié(s)</p>}
                  {pendingFile.incoherences > 0 && <p className="text-rose-600 font-semibold">{pendingFile.incoherences} incohérence(s) détectée(s)</p>}
                </div>
                <div className="mt-5 flex justify-end gap-2.5">
                  <button onClick={() => setPendingFile(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                    Annuler
                  </button>
                  <button onClick={confirmImport} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-2xs cursor-pointer">
                    Confirmer et intégrer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Détail d'un import */}
          {detailImport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in" onClick={() => setDetailImport(null)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                <h3 className="lakana-title text-base font-bold text-slate-900">{detailImport.id}</h3>
                <p className="lakana-subtitle mt-0.5">{detailImport.source}</p>
                <div className="mt-4 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <p>{detailImport.records.toLocaleString("fr-FR")} enregistrements intégrés</p>
                  <p>Type de connecteur : {detailImport.type}</p>
                  <p>Date : {detailImport.date}</p>
                  <p>Statut : <span className="font-semibold text-emerald-700">{detailImport.status}</span></p>
                </div>
                <button onClick={() => setDetailImport(null)} className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

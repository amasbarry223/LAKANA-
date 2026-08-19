"use client"

import { useState } from "react"
import { Wifi, CloudOff, RefreshCw, Database, CheckCircle2, AlertTriangle, Clock, Upload, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Source = {
  name: string
  type: "Liste sanctions" | "Liste PPE" | "Connecteur SFD" | "Base locale"
  lastSync: string
  status: "À jour" | "En attente" | "Erreur"
  records: number
  version?: string
}

const sources: Source[] = [
  { name: "Liste sanctions ONU", type: "Liste sanctions", lastSync: "25/08/2026 06:00", status: "À jour", records: 1842, version: "v3.12" },
  { name: "Liste sanctions GAFI", type: "Liste sanctions", lastSync: "25/08/2026 06:05", status: "À jour", records: 967, version: "v2.8" },
  { name: "CENTIF-Mali", type: "Liste sanctions", lastSync: "25/08/2026 06:10", status: "À jour", records: 412, version: "v1.9" },
  { name: "Liste PPE Mali", type: "Liste PPE", lastSync: "25/08/2026 13:42", status: "À jour", records: 286, version: "v2.4" },
  { name: "Connecteur SFD Bamako", type: "Connecteur SFD", lastSync: "25/08/2026 14:30", status: "À jour", records: 5421 },
  { name: "Connecteur SFD Sikasso", type: "Connecteur SFD", lastSync: "25/08/2026 12:15", status: "À jour", records: 3120 },
  { name: "Connecteur SFD Kayes", type: "Connecteur SFD", lastSync: "24/08/2026 18:00", status: "En attente", records: 2044 },
  { name: "Base locale chiffrée", type: "Base locale", lastSync: "25/08/2026 14:30", status: "À jour", records: 18428 },
]

const statusConfig: Record<Source["status"], { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  "À jour": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  "En attente": { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  "Erreur": { color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle },
}

type QueueItem = {
  id: string
  type: string
  client: string
  date: string
  pending: boolean
}

const offlineQueue: QueueItem[] = [
  { id: "Q-012", type: "Alerte générée hors ligne", client: "Traoré, Moussa", date: "25/08/2026 08:15", pending: true },
  { id: "Q-011", type: "Alerte générée hors ligne", client: "Diarra, Fatoumata", date: "25/08/2026 07:42", pending: true },
  { id: "Q-010", type: "Investigation modifiée", client: "Keïta, Ibrahim", date: "25/08/2026 07:10", pending: true },
  { id: "Q-009", type: "Score recalculé", client: "Coulibaly, Aïssata", date: "24/08/2026 19:30", pending: false },
]

export function SyncView() {
  const [online, setOnline] = useState(true)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Synchronisation</h1>
          <p className="mt-1 text-sm text-slate-500">Mode hors ligne, base locale chiffrée et files d'attente (OFF-01 à 04).</p>
        </div>
        <button
          onClick={() => setOnline(!online)}
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition",
            online
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          )}
        >
          {online ? <Wifi className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
          {online ? "En ligne" : "Mode hors ligne"}
        </button>
      </div>

      {/* Status banner */}
      <div className={cn(
        "flex items-center gap-3 rounded-xl border p-4",
        online ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
      )}>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          online ? "bg-emerald-100" : "bg-amber-100"
        )}>
          {online ? <Wifi className="h-6 w-6 text-emerald-600" /> : <CloudOff className="h-6 w-6 text-amber-600" />}
        </div>
        <div className="flex-1">
          <p className={cn("text-sm font-semibold", online ? "text-emerald-800" : "text-amber-800")}>
            {online ? "Connexion établie — données synchronisées" : "Connexion perdue — mode hors ligne actif"}
          </p>
          <p className={cn("mt-0.5 text-xs", online ? "text-emerald-600" : "text-amber-600")}>
            {online
              ? "Dernière synchronisation : 25/08/2026 à 14:30. Les listes sont à jour."
              : "Base locale chiffrée active (OFF-01). Resynchronisation automatique à la reconnexion (OFF-02)."}
          </p>
        </div>
        {online && (
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
            <RefreshCw className="h-3.5 w-3.5" />
            Synchroniser
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Sources connectées", value: `${sources.filter((s) => s.status === "À jour").length}/${sources.length}`, icon: Database, color: "#10B981" },
          { label: "Enregistrements locaux", value: "18 428", icon: Database, color: "#6366F1" },
          { label: "File d'attente hors ligne", value: offlineQueue.filter((q) => q.pending).length, icon: Clock, color: "#F59E0B" },
          { label: "Ancienneté base locale", value: "0 min", icon: Clock, color: "#06B6D4" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-slate-500">{s.label}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${s.color}15` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sources + Queue */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Sources */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Sources de données</h3>
            <button className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
              <RefreshCw className="h-3 w-3" />
              Tout synchroniser
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {sources.map((s) => {
              const sc = statusConfig[s.status]
              const Icon = sc.icon
              return (
                <div key={s.name} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Database className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-800">{s.name}</p>
                      {s.version && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{s.version}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {s.type} • {s.records.toLocaleString("fr-FR")} enregistrements • {s.lastSync}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("border gap-1", sc.color)}>
                    <Icon className="h-2.5 w-2.5" />
                    {s.status}
                  </Badge>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Offline queue */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">File d'attente hors ligne</h3>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              {offlineQueue.filter((q) => q.pending).length} en attente
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Alertes générées hors ligne, remontées sans perte de traçabilité (OFF-04).
          </p>
          <div className="mt-4 space-y-2">
            {offlineQueue.map((q) => (
              <div
                key={q.id}
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-3",
                  q.pending ? "border-amber-200 bg-amber-50/50" : "border-slate-100 bg-slate-50"
                )}
              >
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  q.pending ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {q.pending ? <Upload className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800">{q.type}</p>
                  <p className="text-[11px] text-slate-400">{q.client}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{q.id} • {q.date}</p>
                </div>
                {q.pending ? (
                  <span className="text-[10px] font-semibold text-amber-600">En attente</span>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            ))}
          </div>
          <button
            disabled={online}
            className={cn(
              "mt-3 w-full rounded-lg py-2 text-xs font-semibold transition",
              online
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            )}
          >
            {online ? "Remonter la file maintenant" : "Reconnexion requise"}
          </button>
        </div>
      </div>

      {/* Data freshness indicator (OFF-03) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Ancienneté des données locales</h3>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Récent — seuil OK (OFF-03)
          </Badge>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-500">Seuil d'alerte ancienneté : 24h</span>
            <span className="font-semibold text-emerald-600">0 min — à jour</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[2%] rounded-full bg-emerald-500" />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
            <span>0h</span>
            <span>6h</span>
            <span>12h</span>
            <span>18h</span>
            <span className="text-rose-400">24h (seuil)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

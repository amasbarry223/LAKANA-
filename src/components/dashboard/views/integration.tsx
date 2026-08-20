"use client"

import { useState } from "react"
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, RefreshCw, Database, ChevronRight, Plug } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ImportItem = {
  id: string
  source: string
  type: "API" | "CSV" | "Excel" | "Synchronisation"
  date: string
  records: number
  status: "Validé" | "Erreurs" | "En file"
  doublons?: number
  incoherences?: number
}

const imports: ImportItem[] = [
  { id: "INT-1042", source: "SFD Bamako — API", type: "API", date: "25/08/2026 14:30", records: 12847, status: "Validé" },
  { id: "INT-1041", source: "SFD Sikasso — API", type: "API", date: "25/08/2026 12:15", records: 5421, status: "Validé" },
  { id: "INT-1040", source: "SFD Kayes — fichier CSV", type: "CSV", date: "25/08/2026 09:00", records: 3120, status: "Erreurs", doublons: 12, incoherences: 3 },
  { id: "INT-1039", source: "Import Excel — Clients CIF", type: "Excel", date: "24/08/2026 16:45", records: 856, status: "Validé" },
  { id: "INT-1038", source: "SFD Bamako — API", type: "API", date: "24/08/2026 14:30", records: 11203, status: "Validé" },
  { id: "INT-1037", source: "Synchronisation différée — Kayes", type: "Synchronisation", date: "24/08/2026 06:00", records: 2044, status: "Validé" },
  { id: "INT-1036", source: "SFD Sikasso — fichier CSV", type: "CSV", date: "23/08/2026 11:20", records: 2890, status: "Erreurs", doublons: 5, incoherences: 1 },
  { id: "INT-1035", source: "Import Excel — Transactions T2", type: "Excel", date: "22/08/2026 10:00", records: 15640, status: "En file" },
]

const statusConfig: Record<ImportItem["status"], { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  "Validé": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  "Erreurs": { color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle },
  "En file": { color: "bg-amber-50 text-amber-700 border-amber-200", icon: RefreshCw },
}

const typeColor: Record<ImportItem["type"], string> = {
  "API": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "CSV": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Excel": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Synchronisation": "bg-violet-50 text-violet-700 border-violet-200",
}

const connectors = [
  { name: "SFD Bamako", type: "API REST", status: "Connecté", color: "#10B981", lastSync: "14:30" },
  { name: "SFD Sikasso", type: "API REST", status: "Connecté", color: "#10B981", lastSync: "12:15" },
  { name: "SFD Kayes", type: "Fichier CSV", status: "Dégradé", color: "#F59E0B", lastSync: "09:00" },
  { name: "Import manuel", type: "CSV / Excel", status: "Disponible", color: "#6366F1", lastSync: "—" },
]

export function IntegrationView() {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Intégration & Ingestion</h1>
        <p className="mt-1 text-sm text-slate-500">Import des données clients, comptes et transactions depuis les systèmes existants (INT-01 à 06).</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Imports aujourd'hui", value: 8, color: "#6366F1" },
          { label: "Enregistrements intégrés", value: "48,9k", color: "#10B981" },
          { label: "Doublons détectés", value: 17, color: "#F59E0B" },
          { label: "Incohérences", value: 4, color: "#EF4444" },
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

      {/* Upload zone + connectors */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Drag & drop upload (INT-01) */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            toast.success("Fichier importé", { description: "Import en cours — validation, détection doublons, analyse auto (INT-02/03/06)." })
          }}
          className={cn(
            "rounded-xl border-2 border-dashed bg-white p-6 text-center transition xl:col-span-2",
            dragOver ? "border-indigo-400 bg-indigo-50/50" : "border-slate-200"
          )}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <UploadCloud className="h-7 w-7 text-indigo-600" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">Déposez un fichier ici</p>
          <p className="mt-1 text-xs text-slate-400">Formats acceptés : CSV, Excel (.xlsx) — INT-01</p>
          <button
            onClick={() => toast.info("Sélection de fichier", { description: "Formats acceptés : CSV, Excel (INT-01)." })}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <FileText className="h-3.5 w-3.5" />
            Choisir un fichier
          </button>
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
            <div className="rounded-md bg-slate-50 p-2">
              <p className="font-semibold text-slate-600">1. Validation</p>
              <p>Format & complétude (INT-02)</p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <p className="font-semibold text-slate-600">2. Détection</p>
              <p>Doublons & incohérences (INT-03)</p>
            </div>
            <div className="rounded-md bg-slate-50 p-2">
              <p className="font-semibold text-slate-600">3. Analyse auto</p>
              <p>Scoring déclenché (INT-06)</p>
            </div>
          </div>
        </div>

        {/* Connectors */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1">
          <h3 className="text-base font-semibold text-slate-900">Connecteurs</h3>
          <p className="mt-1 text-xs text-slate-400">Sources connectées aux SFD (BO-07)</p>
          <div className="mt-4 space-y-2">
            {connectors.map((c) => (
              <div key={c.name} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${c.color}15` }}>
                  <Plug className="h-4 w-4" style={{ color: c.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="text-[11px] text-slate-400">{c.type}</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[11px] font-semibold",
                    c.status === "Connecté" ? "text-emerald-600" : c.status === "Dégradé" ? "text-amber-600" : "text-slate-500"
                  )}>
                    {c.status}
                  </span>
                  <p className="text-[10px] text-slate-400">{c.lastSync}</p>
                </div>
                <button
                  onClick={() => toast.success("Connecteur synchronisé", { description: "Synchronisation relancée (BO-07)." })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Synchroniser ce connecteur"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import history */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Journal des imports (INT-04)</h3>
          </div>
          <span className="text-xs text-slate-400">{imports.length} imports récents</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5 font-semibold">Source</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 text-right font-semibold">Enregistrements</th>
                <th className="px-3 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Statut</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {imports.map((im) => {
                const sc = statusConfig[im.status]
                const Icon = sc.icon
                return (
                  <tr key={im.id} onClick={() => toast.info(`Import ${im.id}`, { description: `${im.source} — ${im.records.toLocaleString("fr-FR")} enregistrements` })} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{im.source}</p>
                      <p className="text-[11px] text-slate-400">{im.id}</p>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className={cn("border", typeColor[im.type])}>{im.type}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">
                      {im.records.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-3 text-slate-500">{im.date}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("border gap-1", sc.color)}>
                          <Icon className="h-2.5 w-2.5" />
                          {im.status}
                        </Badge>
                        {im.doublons && (
                          <span className="text-[10px] text-amber-600">{im.doublons} doublons</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2.5 text-xs text-indigo-700">
        <RefreshCw className="h-3.5 w-3.5 shrink-0" />
        <span>L'analyse (scoring, filtrage) est déclenchée automatiquement dès qu'une nouvelle transaction est intégrée (INT-06). Synchronisation différée en cas de connectivité instable (INT-05).</span>
      </div>
    </div>
  )
}

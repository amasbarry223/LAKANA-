"use client"

import { useRef, useState } from "react"
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, RefreshCw, Database, ChevronRight, Plug, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useDashboard, type ImportItem } from "@/lib/dashboard-context"

const statusConfig: Record<ImportItem["status"], { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  Validé: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  Erreurs: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle },
  "En file": { color: "bg-amber-50 text-amber-700 border-amber-200", icon: RefreshCw },
}

const typeColor: Record<ImportItem["type"], string> = {
  API: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CSV: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Excel: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Synchronisation: "bg-violet-50 text-violet-700 border-violet-200",
}

const connectors = [
  { name: "SFD Bamako", type: "API REST", status: "Connecté", color: "#10B981", lastSync: "14:30" },
  { name: "SFD Sikasso", type: "API REST", status: "Connecté", color: "#10B981", lastSync: "12:15" },
  { name: "SFD Kayes", type: "Fichier CSV", status: "Dégradé", color: "#F59E0B", lastSync: "09:00" },
  { name: "Import manuel", type: "CSV / Excel", status: "Disponible", color: "#6366F1", lastSync: "-" },
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
  const { imports, addImport } = useDashboard()
  const [dragOver, setDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null)
  const [detailImport, setDetailImport] = useState<ImportItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      source: `Import manuel : ${pendingFile.name}`,
      type: pendingFile.type,
      records: pendingFile.records,
      status: hasErrors ? "Erreurs" : "Validé",
      doublons: pendingFile.doublons || undefined,
      incoherences: pendingFile.incoherences || undefined,
    })
    toast.success("Fichier intégré avec succès", {
      description: `${pendingFile.records.toLocaleString("fr-FR")} enregistrements intégrés : analyse auto déclenchée (INT-06).`,
    })
    setPendingFile(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Intégration & Ingestion</h1>
        <p className="mt-1 text-sm text-slate-500">Import des données clients, comptes et transactions depuis les systèmes existants (INT-01 à 06).</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Imports aujourd'hui", value: imports.length, color: "#6366F1" },
          { label: "Enregistrements intégrés", value: "48,9k", color: "#10B981" },
          { label: "Doublons détectés", value: imports.reduce((s, i) => s + (i.doublons ?? 0), 0), color: "#F59E0B" },
          { label: "Incohérences", value: imports.reduce((s, i) => s + (i.incoherences ?? 0), 0), color: "#EF4444" },
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
            "rounded-xl border-2 border-dashed bg-white p-6 text-center transition xl:col-span-2",
            dragOver ? "border-indigo-400 bg-indigo-50/50" : "border-slate-200"
          )}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <UploadCloud className="h-7 w-7 text-indigo-600" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">Déposez un fichier ici</p>
          <p className="mt-1 text-xs text-slate-400">Formats acceptés : CSV, Excel (.xlsx) : INT-01</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <FileText className="h-3.5 w-3.5" />
            Choisir un fichier
          </button>
        </div>

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
                <button
                  onClick={() => {
                    addImport({
                      source: `${c.name} : sync manuelle`,
                      type: "API",
                      records: Math.floor(Math.random() * 3000) + 500,
                      status: "Validé",
                    })
                    toast.success("Connecteur synchronisé", { description: `${c.name} : synchronisation relancée (BO-07).` })
                  }}
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
                  <tr key={im.id} onClick={() => setDetailImport(im)} className="cursor-pointer hover:bg-slate-50">
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
                      <Badge variant="outline" className={cn("border gap-1", sc.color)}>
                        <Icon className="h-2.5 w-2.5" />
                        {im.status}
                      </Badge>
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

      {pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setPendingFile(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Validation de l'import</h3>
              <button onClick={() => setPendingFile(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-slate-400">Fichier :</span> <strong>{pendingFile.name}</strong></p>
              <p><span className="text-slate-400">Taille :</span> {(pendingFile.size / 1024).toFixed(1)} Ko</p>
              <p><span className="text-slate-400">Type :</span> {pendingFile.type}</p>
              <p><span className="text-slate-400">Enregistrements estimés :</span> {pendingFile.records.toLocaleString("fr-FR")}</p>
              {pendingFile.doublons > 0 && <p className="text-amber-600">{pendingFile.doublons} doublon(s) détecté(s) (INT-03)</p>}
              {pendingFile.incoherences > 0 && <p className="text-rose-600">{pendingFile.incoherences} incohérence(s) (INT-03)</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setPendingFile(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Annuler
              </button>
              <button onClick={confirmImport} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Confirmer l'import
              </button>
            </div>
          </div>
        </div>
      )}

      {detailImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setDetailImport(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">{detailImport.id}</h3>
            <p className="mt-1 text-sm text-slate-500">{detailImport.source}</p>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <p>{detailImport.records.toLocaleString("fr-FR")} enregistrements · {detailImport.type}</p>
              <p>Statut : {detailImport.status} · {detailImport.date}</p>
            </div>
            <button onClick={() => setDetailImport(null)} className="mt-5 w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

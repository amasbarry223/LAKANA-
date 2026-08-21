"use client"

import { useState, useEffect } from "react"
import { FileBarChart, Download, Calendar, CheckCircle2, Clock, FileText, ChevronRight, ChevronDown, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Report = {
  id: string
  title: string
  type: "BCEAO" | "CENTIF-Mali" | "Contrôle interne" | "Synthèse mensuelle"
  period: string
  generatedAt: string
  status: "Généré" | "En file d'attente" | "Planifié"
  size: string
  format: "PDF" | "XLSX"
}

const initialReports: Report[] = [
  { id: "RPT-024", title: "Déclaration de soupçon — CENTIF", type: "CENTIF-Mali", period: "Août 2026", generatedAt: "25/08/2026 10:15", status: "Généré", size: "1,2 Mo", format: "PDF" },
  { id: "RPT-023", title: "Synthèse alertes mensuelle", type: "Contrôle interne", period: "Juillet 2026", generatedAt: "05/08/2026 08:00", status: "Généré", size: "3,4 Mo", format: "XLSX" },
  { id: "RPT-022", title: "Rapport conformité BCEAO", type: "BCEAO", period: "T2 2026", generatedAt: "15/07/2026 14:30", status: "Généré", size: "2,8 Mo", format: "PDF" },
  { id: "RPT-021", title: "Déclaration de soupçon — CENTIF", type: "CENTIF-Mali", period: "Juillet 2026", generatedAt: "28/07/2026 11:20", status: "Généré", size: "0,9 Mo", format: "PDF" },
  { id: "RPT-020", title: "Synthèse alertes mensuelle", type: "Contrôle interne", period: "Juin 2026", generatedAt: "03/07/2026 08:00", status: "Généré", size: "3,1 Mo", format: "XLSX" },
  { id: "RPT-025", title: "Synthèse alertes mensuelle", type: "Contrôle interne", period: "Août 2026", generatedAt: "—", status: "Planifié", size: "—", format: "XLSX" },
]

const statusConfig: Record<Report["status"], { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  "Généré": { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  "En file d'attente": { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  "Planifié": { color: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock },
}

const typeColor: Record<Report["type"], string> = {
  "BCEAO": "bg-blue-50 text-blue-700 border-blue-200",
  "CENTIF-Mali": "bg-rose-50 text-rose-700 border-rose-200",
  "Contrôle interne": "bg-slate-100 text-slate-700 border-slate-200",
  "Synthèse mensuelle": "bg-indigo-50 text-indigo-700 border-indigo-200",
}

const formatColor: Record<Report["format"], string> = {
  PDF: "bg-rose-50 text-rose-700 border-rose-200",
  XLSX: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const templates = [
  { title: "Déclaration de soupçon CENTIF", desc: "Format réglementaire CENTIF-Mali", type: "CENTIF-Mali", color: "#EF4444" },
  { title: "Rapport trimestriel BCEAO", desc: "Conformité LBC/FT — Banque centrale", type: "BCEAO", color: "#3B82F6" },
  { title: "Synthèse mensuelle interne", desc: "Tableau de bord conformité", type: "Contrôle interne", color: "#64748B" },
  { title: "Export investigations clôturées", desc: "Liste des dossiers traités", type: "Synthèse mensuelle", color: "#6366F1" },
]

export function ReportsView() {
  const [period, setPeriod] = useState("Août 2026")
  const [periodOpen, setPeriodOpen] = useState(false)
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [generating, setGenerating] = useState<string | null>(null)
  const [previewReport, setPreviewReport] = useState<Report | null>(null)

  // Escape key closes the preview modal
  useEffect(() => {
    if (!previewReport) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewReport(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [previewReport])

  const periodOptions = ["Juillet 2026", "Août 2026", "T2 2026", "T3 2026", "Année 2026"]

  const selectPeriod = (p: string) => {
    setPeriod(p)
    setPeriodOpen(false)
    toast.success("Période mise à jour", { description: p })
  }

  const handleGenerate = (t: { title: string; desc: string; type: Report["type"]; color: string }) => {
    if (generating) return
    setGenerating(t.title)
    toast.info("Génération en cours...", { description: t.title })
    setTimeout(() => {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, "0")
      const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      const sizeMo = (Math.random() * 4.5 + 0.5).toFixed(1).replace(".", ",")
      const newId = `RPT-${String(100 + reports.length + 1).padStart(3, "0")}`
      const newReport: Report = {
        id: newId,
        title: t.title,
        type: t.type,
        period,
        generatedAt: dateStr,
        status: "Généré",
        size: `${sizeMo} Mo`,
        format: t.type === "Contrôle interne" ? "XLSX" : "PDF",
      }
      setReports((prev) => [newReport, ...prev])
      setGenerating(null)
      toast.success("Rapport généré", { description: `${t.title} — prêt au téléchargement.` })
    }, 2000)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Rapports réglementaires</h1>
          <p className="mt-1 text-sm text-slate-500">Génération d'exports destinés à la BCEAO, au CENTIF et aux contrôles internes (BO-06).</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Calendar className="h-3.5 w-3.5" />
            Période : {period}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          {periodOpen && (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Période</p>
              {periodOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => selectPeriod(p)}
                  className={cn(
                    "block w-full rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-slate-50",
                    period === p ? "font-semibold text-indigo-700" : "text-slate-600"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Rapports générés", value: reports.filter((r) => r.status === "Généré").length, color: "#10B981" },
          { label: "Déclarations CENTIF", value: reports.filter((r) => r.type === "CENTIF-Mali").length, color: "#EF4444" },
          { label: "Rapports BCEAO", value: reports.filter((r) => r.type === "BCEAO").length, color: "#3B82F6" },
          { label: "Planifiés", value: reports.filter((r) => r.status === "Planifié").length, color: "#64748B" },
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

      {/* Templates */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold text-slate-900">Générer un rapport</h3>
        <p className="mt-1 text-xs text-slate-400">Sélectionnez un modèle, choisissez la période et générez l'export.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {templates.map((t) => {
            const isGenerating = generating === t.title
            const disabled = generating !== null
            return (
              <button
                key={t.title}
                onClick={() => handleGenerate(t)}
                disabled={disabled}
                className={cn(
                  "group rounded-xl border border-slate-200 p-4 text-left transition",
                  disabled ? "cursor-not-allowed opacity-60" : "hover:border-indigo-300 hover:bg-indigo-50/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${t.color}15` }}>
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: t.color }} />
                    ) : (
                      <FileText className="h-4 w-4" style={{ color: t.color }} />
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{t.title}</p>
                <p className="mt-1 text-xs text-slate-400">{t.desc}</p>
                <Badge variant="outline" className={cn("mt-2 border", typeColor[t.type])}>{t.type}</Badge>
                {isGenerating && (
                  <p className="mt-2 text-[11px] font-medium text-indigo-600">Génération en cours...</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Reports history */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Historique des rapports</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {reports.map((r) => {
            const sc = statusConfig[r.status]
            const Icon = sc.icon
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-slate-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                  <FileBarChart className="h-5 w-5 text-slate-500" />
                </div>
                <div className="min-w-[200px] flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                    <Badge variant="outline" className={cn("border", typeColor[r.type])}>{r.type}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {r.id} • {r.period} • {r.format} {r.size !== "—" && `• ${r.size}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Généré le</p>
                    <p className="text-xs font-medium text-slate-600">{r.generatedAt}</p>
                  </div>
                  <Badge variant="outline" className={cn("border gap-1", sc.color)}>
                    <Icon className="h-2.5 w-2.5" />
                    {r.status}
                  </Badge>
                  {r.status === "Généré" && (
                    <button
                      onClick={() => setPreviewReport(r)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      title="Aperçu avant téléchargement"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2.5 text-xs text-indigo-700">
        <FileBarChart className="h-3.5 w-3.5 shrink-0" />
        <span>Les exports sont générés au format PDF ou tableur sur une période donnée (BO-06) et conservés pour piste d'audit.</span>
      </div>

      {/* Report preview modal */}
      {previewReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setPreviewReport(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{previewReport.title}</h3>
                <Badge variant="outline" className={cn("border", formatColor[previewReport.format])}>
                  {previewReport.format}
                </Badge>
              </div>
              <button
                onClick={() => setPreviewReport(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Metadata */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { label: "ID", value: previewReport.id },
                { label: "Période", value: previewReport.period },
                { label: "Généré le", value: previewReport.generatedAt },
                { label: "Taille", value: previewReport.size },
                { label: "Type", value: previewReport.type },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400">{m.label}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-900">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Preview area */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-slate-600">Aperçu du contenu</p>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                {previewReport.type === "CENTIF-Mali" && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2 font-semibold">Déclarant</th>
                        <th className="px-3 py-2 text-right font-semibold">Montant</th>
                        <th className="px-3 py-2 font-semibold">Motif</th>
                        <th className="px-3 py-2 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { d: "Traoré, M.", amt: "4 800 000 FCFA", motif: "Fractionnement", date: "25/08/2026" },
                        { d: "Diarra, F.", amt: "3 650 000 FCFA", motif: "Volume inhabituel", date: "24/08/2026" },
                        { d: "Sangaré, O.", amt: "2 100 000 FCFA", motif: "Comportement atypique", date: "23/08/2026" },
                        { d: "Coulibaly, A.", amt: "2 850 000 FCFA", motif: "Fréquence anormale", date: "20/08/2026" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-700">{row.d}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">{row.amt}</td>
                          <td className="px-3 py-2 text-slate-600">{row.motif}</td>
                          <td className="px-3 py-2 text-slate-500">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {previewReport.type === "BCEAO" && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2 font-semibold">Indicateur BCEAO</th>
                        <th className="px-3 py-2 text-right font-semibold">Valeur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { k: "Transactions analysées (T2)", v: "38 612" },
                        { k: "Alertes générées", v: "1 247" },
                        { k: "Déclarations CENTIF transmises", v: "18" },
                        { k: "Taux de déclaration", v: "1,44%" },
                        { k: "Délai moyen de traitement", v: "4,2 jours" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-700">{row.k}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">{row.v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(previewReport.type === "Contrôle interne" || previewReport.type === "Synthèse mensuelle") && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
                        <th className="px-3 py-2 font-semibold">Catégorie d'alerte</th>
                        <th className="px-3 py-2 text-right font-semibold">Total</th>
                        <th className="px-3 py-2 text-right font-semibold">Confirmées</th>
                        <th className="px-3 py-2 text-right font-semibold">Faux positifs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { cat: "Fractionnement", tot: 167, conf: 41, fp: 126 },
                        { cat: "Correspondances PPE", tot: 89, conf: 12, fp: 77 },
                        { cat: "Volume inhabituel", tot: 73, conf: 9, fp: 64 },
                        { cat: "Comportement atypique", tot: 51, conf: 7, fp: 44 },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-700">{row.cat}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">{row.tot}</td>
                          <td className="px-3 py-2 text-right text-rose-600">{row.conf}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{row.fp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewReport(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Fermer
              </button>
          <button
            onClick={() => {
              const content = `LAKANA — ${previewReport.title}\nPériode: ${previewReport.period}\nType: ${previewReport.type}\nFormat: ${previewReport.format}\nGénéré: ${previewReport.generatedAt}\n\n--- Rapport réglementaire (BO-06) ---\n`
              const blob = new Blob([content], { type: previewReport.format === "PDF" ? "application/pdf" : "text/csv" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `${previewReport.id}.${previewReport.format === "PDF" ? "pdf" : "csv"}`
              a.click()
              URL.revokeObjectURL(url)
              toast.success("Téléchargement", { description: `${previewReport.title} (${previewReport.format}).` })
              setPreviewReport(null)
            }}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Download className="h-3.5 w-3.5" />
                Télécharger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

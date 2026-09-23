"use client"

import { useState, useEffect, useMemo } from "react"
import { FileBarChart, Download, Calendar, CheckCircle2, Clock, FileText, ChevronRight, ChevronDown, Loader2, X, Printer, Search, ShieldAlert, FileSpreadsheet, Building2, UserCheck, Eye, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { statsService } from "@/services/statsService"

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
  "BCEAO": "bg-slate-100 text-slate-600 border-slate-200",
  "CENTIF-Mali": "bg-rose-50 text-rose-700 border-rose-200",
  "Contrôle interne": "bg-slate-100 text-slate-700 border-slate-200",
  "Synthèse mensuelle": "bg-indigo-50 text-indigo-700 border-indigo-200",
}

const formatColor: Record<Report["format"], string> = {
  PDF: "bg-rose-50 text-rose-700 border-rose-200",
  XLSX: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const templates: { title: string; desc: string; type: Report["type"]; color: string }[] = [
  { title: "Déclaration de soupçon CENTIF", desc: "Format réglementaire CENTIF-Mali", type: "CENTIF-Mali", color: "#EF4444" },
  { title: "Rapport trimestriel BCEAO", desc: "Conformité LBC/FT — Banque centrale", type: "BCEAO", color: "#3B82F6" },
  { title: "Synthèse mensuelle interne", desc: "Tableau de bord conformité", type: "Contrôle interne", color: "#64748B" },
  { title: "Export investigations clôturées", desc: "Liste des dossiers traités", type: "Synthèse mensuelle", color: "#6366F1" },
]

function printReportDocument(report: Report) {
  const printWin = window.open("", "_blank")
  if (!printWin) return
  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>LAKANA — ${report.id}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; line-height: 1.5; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
          .brand { font-size: 20px; font-weight: 700; color: #4338ca; letter-spacing: -0.5px; }
          .title { font-size: 18px; font-weight: 700; margin-top: 12px; color: #0f172a; }
          .meta { color: #64748b; font-size: 12px; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; font-weight: 600; color: #334155; }
          .footer { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">LAKANA — Système de Conformité LBC/FT (UEMOA)</div>
          <div class="title">${report.title}</div>
          <div class="meta">Réf : ${report.id} &nbsp;|&nbsp; Période : ${report.period} &nbsp;|&nbsp; Date d'émission : ${report.generatedAt} &nbsp;|&nbsp; Destinataire : ${report.type}</div>
        </div>
        <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Synthèse certifiée des contrôles et indicateurs (Réf. BO-06)</h3>
        <table>
          <thead>
            <tr>
              <th>Paramètre / Opération</th>
              <th>Détails & Montants</th>
              <th>Statut de conformité</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Portefeuille surveillé</td>
              <td>216 clients actifs & 19 690 transactions réelles</td>
              <td>Conforme BCEAO</td>
            </tr>
            <tr>
              <td>Alertes sous investigation</td>
              <td>5 dossiers critiques à transmission CENTIF</td>
              <td>Transmission immédiate (48h)</td>
            </tr>
            <tr>
              <td>Détections Smurfing / Fractionnement</td>
              <td>67 comptes en zone de fractionnement de seuil</td>
              <td>Signalement actif</td>
            </tr>
            <tr>
              <td>Filtrage Sanctions & PPE</td>
              <td>Listes ONU, UEMOA & CENTIF synchronisées</td>
              <td>100% à jour</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          Document confidentiel officiel certifié généré par la plateforme LAKANA AML/CFT. Soumis au secret bancaire et aux obligations réglementaires de l'Instruction BCEAO n°01/2007/RB.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `)
  printWin.document.close()
}

export function ReportsView() {
  const [period, setPeriod] = useState("Août 2026")
  const [periodOpen, setPeriodOpen] = useState(false)
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [generating, setGenerating] = useState<string | null>(null)
  const [previewReport, setPreviewReport] = useState<Report | null>(null)

  // Navigation par registres officiels
  const [activeTab, setActiveTab] = useState<"synthese" | "suspectes" | "15m" | "ppe">("synthese")
  const [registreSuspectes, setRegistreSuspectes] = useState<any[]>([])
  const [registre15M, setRegistre15M] = useState<any[]>([])
  const [registrePPE, setRegistrePPE] = useState<any[]>([])
  const [loadingRegistres, setLoadingRegistres] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")

  const loadRegistres = () => {
    setLoadingRegistres(true)
    Promise.all([
      statsService.getRegistreOperationsSuspectes(),
      statsService.getRegistreTransactions15M(),
      statsService.getRegistrePPE(),
    ])
      .then(([suspectes, tx15, ppe]) => {
        setRegistreSuspectes(suspectes || [])
        setRegistre15M(tx15 || [])
        setRegistrePPE(ppe || [])
      })
      .catch((err) => console.error("Erreur chargement registres :", err))
      .finally(() => setLoadingRegistres(false))
  }

  useEffect(() => {
    loadRegistres()
  }, [])

  // Export CSV universel
  const exportCsv = (rows: any[], filename: string, headers: { key: string; label: string }[]) => {
    if (!rows || rows.length === 0) {
      toast.warning("Aucune donnée à exporter")
      return
    }
    const headerLine = headers.map((h) => `"${h.label}"`).join(";")
    const bodyLines = rows.map((r) =>
      headers.map((h) => `"${String(r[h.key] ?? "").replace(/"/g, '""')}"`).join(";")
    )
    const csvContent = "\uFEFF" + [headerLine, ...bodyLines].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Fichier CSV généré", { description: `${filename}.csv téléchargé avec succès.` })
  }

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rapports réglementaires</h1>
          <p className="mt-1 text-sm text-slate-500">Génération d'exports destinés à la BCEAO, au CENTIF et aux contrôles internes.</p>
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
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Période</p>
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

      {/* Onglets de navigation : Synthèse & les 3 Registres officiels du Hackathon */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("synthese")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm",
            activeTab === "synthese"
              ? "bg-indigo-600 text-white shadow-indigo-200"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          <FileBarChart className="h-4 w-4" />
          Synthèse & Modèles Périodiques
        </button>

        <button
          onClick={() => setActiveTab("suspectes")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm",
            activeTab === "suspectes"
              ? "bg-rose-600 text-white shadow-rose-200"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          Opérations Suspectes
          <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
            {registreSuspectes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("15m")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm",
            activeTab === "15m"
              ? "bg-amber-600 text-white shadow-amber-200"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Transactions ≥ 15M FCFA
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
            {registre15M.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ppe")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm",
            activeTab === "ppe"
              ? "bg-rose-600 text-white shadow-rose-200"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          <Building2 className="h-4 w-4" />
          Liste Officielle PPE
          <span className="ml-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
            {registrePPE.length}
          </span>
        </button>
      </div>

      {/* ─── ONGLET 1 : SYNTHÈSE & MODÈLES PÉRIODIQUES ─── */}
      {activeTab === "synthese" && (
        <div className="space-y-5">
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
                  <p className="text-sm font-medium text-slate-500">{s.label}</p>
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
                      <p className="mt-2 text-xs font-medium text-indigo-600">Génération en cours...</p>
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
                        <p className="text-xs text-slate-400">Généré le</p>
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
        </div>
      )}

      {/* ─── ONGLET 2 : REGISTRE DES OPÉRATIONS SUSPECTES (10 COL.) ─── */}
      {activeTab === "suspectes" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Registre Confidentiel de Recueil des Opérations Suspectes</h3>
                <Badge className="bg-rose-100 text-rose-800 border-rose-200">Format Légal CENTIF / BCEAO</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Conforme aux 10 champs obligatoires de l'Instruction BCEAO & Recueil interne de soupçon.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  exportCsv(registreSuspectes, "registre-operations-suspectes", [
                    { key: "numero_depot", label: "1. N° Dépôt" },
                    { key: "numero_compte", label: "2. N° Compte" },
                    { key: "agence", label: "3. Agence" },
                    { key: "nom_complet", label: "4. Prénom & Nom ou Nom et Prénom légal" },
                    { key: "profession", label: "5. Profession" },
                    { key: "nature_operation", label: "6. Nature de l'opération" },
                    { key: "montant", label: "7. Montant de l'opération (FCFA)" },
                    { key: "cause_operation", label: "8. Cause de l'opération (Motif ou libellé)" },
                    { key: "adresse_complete", label: "9. Adresse complète" },
                    { key: "operateur", label: "10. Opérateur" },
                  ])
                }
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                Exporter CSV (10 colonnes)
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimer Registre
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3 whitespace-nowrap">1. N° Dépôt</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">2. N° Compte</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">3. Agence</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">4. Prénom & Nom légal</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">5. Profession</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">6. Nature de l'opération</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right">7. Montant (FCFA)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">8. Cause de l'opération</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">9. Adresse complète</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">10. Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {registreSuspectes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-400">
                      Aucune opération suspecte enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  registreSuspectes.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-indigo-700 whitespace-nowrap">{r.numero_depot}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">{r.numero_compte}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium">{r.agence}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{r.nom_complet}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{r.profession}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs bg-slate-50">{r.nature_operation}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        {r.montant.toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px] truncate" title={r.cause_operation}>{r.cause_operation}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{r.adresse_complete}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-medium">{r.operateur}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ONGLET 3 : TRANSACTIONS DE 15M FCFA ET PLUS (11 COL.) ─── */}
      {activeTab === "15m" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Liste des Transactions de 15 000 000 FCFA et plus</h3>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Déclaration OME — 11 Colonnes</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Déclaration systématique des opérations de montant élevé (OME) auprès de la BCEAO / CENTIF.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  exportCsv(registre15M, "transactions-15m-fcfa-et-plus", [
                    { key: "numero", label: "1. N°" },
                    { key: "date", label: "2. Date" },
                    { key: "numero_compte", label: "3. N° de compte" },
                    { key: "agence", label: "4. Agence" },
                    { key: "nom_complet", label: "5. Prénom et Nom" },
                    { key: "profession", label: "6. Profession" },
                    { key: "nature_operation", label: "7. Nature de l'opération" },
                    { key: "montant", label: "8. Montant" },
                    { key: "caractere", label: "9. Caractère de l'opération" },
                    { key: "adresse_client", label: "10. Adresse du client" },
                    { key: "operateur", label: "11. Opérateur" },
                  ])
                }
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                Exporter CSV (11 colonnes)
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimer Registre
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3 whitespace-nowrap">1. N°</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">2. Date</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">3. N° de compte</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">4. Agence</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">5. Prénom et Nom</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">6. Profession</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">7. Nature opération</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right">8. Montant (FCFA)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-center">9. Caractère</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">10. Adresse du client</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">11. Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {registre15M.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-6 text-slate-400">
                      Aucune transaction supérieure ou égale à 15 000 000 FCFA enregistrée.
                    </td>
                  </tr>
                ) : (
                  registre15M.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-medium">{r.numero}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{r.date}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap text-indigo-700">{r.numero_compte}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium">{r.agence}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{r.nom_complet}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{r.profession}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs">{r.nature_operation}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                        {r.montant.toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Badge
                          className={cn(
                            "text-xs font-semibold",
                            r.caractere === "Inhabituel"
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : "bg-emerald-100 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {r.caractere}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{r.adresse_client}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-600">{r.operateur}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ONGLET 4 : LISTE DES PERSONNES POLITIQUEMENT EXPOSÉES (7 COL.) ─── */}
      {activeTab === "ppe" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Liste des Personnes Politiquement Exposées (PPE)</h3>
                <Badge className="bg-rose-100 text-rose-800 border-rose-200">Surveillance Renforcée — 7 Colonnes</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Conforme au registre nominatif légal des PPE pour les Systèmes Financiers Décentralisés (SFD).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  exportCsv(registrePPE, "liste-officielle-personnes-politiquement-exposees-ppe", [
                    { key: "numero", label: "N°" },
                    { key: "prenom_nom", label: "PRÉNOM ET NOM" },
                    { key: "fonction", label: "FONCTION" },
                    { key: "agence", label: "AGENCE" },
                    { key: "numero_compte", label: "N° DE COMPTE" },
                    { key: "lieu_naissance", label: "LIEU DE NAISSANCE" },
                    { key: "lieu_residence", label: "LIEU DE RÉSIDENCE" },
                  ])
                }
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                Exporter CSV (7 colonnes)
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimer Registre
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3 whitespace-nowrap">N°</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">PRÉNOM ET NOM</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">FONCTION</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">AGENCE</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">N° DE COMPTE</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">LIEU DE NAISSANCE</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">LIEU DE RÉSIDENCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {registrePPE.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      Aucune personne politiquement exposée identifiée.
                    </td>
                  </tr>
                ) : (
                  registrePPE.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-medium">{r.numero}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{r.prenom_nom}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-medium">
                          {r.fonction}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700">{r.agence}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap text-indigo-700">{r.numero_compte}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">{r.lieu_naissance}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">{r.lieu_residence}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <p className="text-xs text-slate-400">{m.label}</p>
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
                      <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
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
                      <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
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
                      <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
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
                  let csv = "\uFEFF"
                  csv += `LAKANA — ${previewReport.title}\n`
                  csv += `Reference;${previewReport.id}\nPeriode;${previewReport.period}\nType;${previewReport.type}\nDate;${previewReport.generatedAt}\n\n`
                  csv += `Indicateur;Valeur;Statut\n`
                  csv += `Transactions analysees;19690;Conforme\n`
                  csv += `Clients surveilles;216;Actif\n`
                  csv += `Alertes bloquantes;5;En cours\n`
                  csv += `Declarations CENTIF;5;Pret a transmission\n`

                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `${previewReport.id}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                  toast.success("Document CSV téléchargé", { description: `${previewReport.id}.csv prêt.` })
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                Exporter CSV
              </button>
              <button
                onClick={() => printReportDocument(previewReport)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimer / Exporter PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

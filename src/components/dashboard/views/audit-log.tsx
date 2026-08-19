"use client"

import { useState } from "react"
import { ScrollText, Search, Download, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type LogEntry = {
  id: string
  date: string
  user: string
  role: string
  module: string
  action: string
  result: "Succès" | "Échec"
  ip: string
}

const logs: LogEntry[] = [
  { id: "LOG-1042", date: "25/08/2026 14:32:08", user: "Aminata Touré", role: "Analyste", module: "Centre d'alertes", action: "Consultation alerte ALR-241", result: "Succès", ip: "10.0.1.42" },
  { id: "LOG-1041", date: "25/08/2026 14:28:51", user: "Aminata Touré", role: "Analyste", module: "Client 360°", action: "Consultation fiche CLI-1042 (Traoré M.)", result: "Succès", ip: "10.0.1.42" },
  { id: "LOG-1040", date: "25/08/2026 14:15:33", user: "Moussa Diallo", role: "Analyste", module: "Investigations", action: "Ouverture dossier INV-235", result: "Succès", ip: "10.0.1.55" },
  { id: "LOG-1039", date: "25/08/2026 13:58:12", user: "Fatoumata Koné", role: "Responsable", module: "Risk Score", action: "Modification pondération R-FRC-01 (30→32 pts)", result: "Succès", ip: "10.0.1.12" },
  { id: "LOG-1038", date: "25/08/2026 13:42:00", user: "Awa Diarra", role: "Analyste", module: "Authentification", action: "Tentative de connexion échouée (3e essai)", result: "Échec", ip: "10.0.2.88" },
  { id: "LOG-1037", date: "25/08/2026 13:41:55", user: "Awa Diarra", role: "Analyste", module: "Authentification", action: "Tentative de connexion échouée (2e essai)", result: "Échec", ip: "10.0.2.88" },
  { id: "LOG-1036", date: "25/08/2026 13:41:48", user: "Awa Diarra", role: "Analyste", module: "Authentification", action: "Tentative de connexion échouée — compte verrouillé", result: "Échec", ip: "10.0.2.88" },
  { id: "LOG-1035", date: "25/08/2026 12:30:14", user: "Fatoumata Koné", role: "Responsable", module: "Filtrage sanctions", action: "Import nouvelle version Liste PPE Mali (v2.4)", result: "Succès", ip: "10.0.1.12" },
  { id: "LOG-1034", date: "25/08/2026 11:08:22", user: "Moussa Diallo", role: "Analyste", module: "Centre d'alertes", action: "Clôture investigation INV-229 — Classée sans suite", result: "Succès", ip: "10.0.1.55" },
  { id: "LOG-1033", date: "25/08/2026 09:15:40", user: "Fatoumata Koné", role: "Responsable", module: "Authentification", action: "Connexion réussie (MFA validé)", result: "Succès", ip: "10.0.1.12" },
  { id: "LOG-1032", date: "24/08/2026 18:40:09", user: "Seydou Traoré", role: "Admin", module: "Utilisateurs", action: "Désactivation compte USR-06 (O. Sangaré)", result: "Succès", ip: "10.0.3.10" },
  { id: "LOG-1031", date: "24/08/2026 16:22:33", user: "Mariam Coulibaly", role: "Auditeur", module: "Journal d'audit", action: "Export journal période 01-24/08/2026", result: "Succès", ip: "10.0.4.22" },
]

const modules = ["Tous modules", "Authentification", "Centre d'alertes", "Client 360°", "Investigations", "Risk Score", "Filtrage sanctions", "Utilisateurs", "Journal d'audit"]

export function AuditLogView() {
  const [query, setQuery] = useState("")
  const [module, setModule] = useState("Tous modules")

  const filtered = logs.filter((l) => {
    const queryOk = !query || l.user.toLowerCase().includes(query.toLowerCase()) || l.action.toLowerCase().includes(query.toLowerCase())
    const moduleOk = module === "Tous modules" || l.module === module
    return queryOk && moduleOk
  })

  const exportLogsCsv = () => {
    const headers = ["date", "user", "role", "module", "action", "result", "ip"]
    const escape = (val: string) => {
      const s = String(val ?? "")
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }
    const rows = logs.map((l) =>
      [l.date, l.user, l.role, l.module, l.action, l.result, l.ip].map(escape).join(",")
    )
    const csv = [headers.join(","), ...rows].join("\r\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Journal exporté", { description: "Export CSV téléchargé (BO-05/06)." })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Journal d'audit</h1>
          <p className="mt-1 text-sm text-slate-500">Traçabilité complète des connexions, actions et décisions (BO-05).</p>
        </div>
        <button
          onClick={exportLogsCsv}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Exporter (BO-06)</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Entrées aujourd'hui", value: 42, color: "#6366F1" },
          { label: "Tentatives échouées", value: 3, color: "#EF4444" },
          { label: "Connexions réussies", value: 18, color: "#10B981" },
          { label: "Actions admin", value: 7, color: "#F59E0B" },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher utilisateur ou action..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex items-center gap-2">
          {modules.slice(0, 5).map((m) => (
            <button
              key={m}
              onClick={() => setModule(m)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                module === m ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {m}
            </button>
          ))}
          <button
            onClick={() => toast.info("Plus de filtres", { description: "Filtres avancés par module." })}
            className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Plus
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Log table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5 font-semibold">Horodatage</th>
                <th className="px-3 py-2.5 font-semibold">Utilisateur</th>
                <th className="px-3 py-2.5 font-semibold">Module</th>
                <th className="px-3 py-2.5 font-semibold">Action</th>
                <th className="px-3 py-2.5 font-semibold">Résultat</th>
                <th className="px-5 py-2.5 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id} onClick={() => toast.info(`Entrée ${l.id}`, { description: `${l.user} — ${l.action}` })} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{l.date}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-800">{l.user}</p>
                    <p className="text-[11px] text-slate-400">{l.role}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{l.module}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{l.action}</td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={cn(
                      "border",
                      l.result === "Succès" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                    )}>
                      {l.result}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-400">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            {filtered.length} entrées affichées sur 1 042
          </span>
          <span>Chaque accès est journalisé avec horodatage et origine (AUTH-08)</span>
        </div>
      </div>
    </div>
  )
}

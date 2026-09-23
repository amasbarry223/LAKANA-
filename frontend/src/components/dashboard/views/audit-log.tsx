"use client"

import { useState, useEffect } from "react"
import { Search, Download, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, X, RefreshCw } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"
import { auditService } from "@/services/auditService"
import { DataPagination } from "@/components/ui/data-pagination"
import { usePageSlice } from "@/hooks/use-pagination"

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



const modules = ["Tous modules", "Authentification", "Centre d'alertes", "Client 360°", "Investigations", "Risk Score", "Filtrage sanctions", "Utilisateurs", "Journal d'audit", "Surveillance Flux"]

type SortColumn = "date" | "user" | "module" | "result"
type SortDir = "asc" | "desc"

const moreModules = [
  "Authentification",
  "Centre d'alertes",
  "Client 360°",
  "Investigations",
  "Risk Score",
  "Filtrage sanctions",
  "Utilisateurs",
  "Journal d'audit",
  "Rapports réglementaires",
  "Surveillance Flux",
]

function SortIcon({ column, sortBy, sortDir }: { column: SortColumn; sortBy: SortColumn | null; sortDir: SortDir }) {
  const Icon: LucideIcon = sortBy !== column ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown
  return <Icon className="h-3 w-3" />
}

export function AuditLogView() {
  const [items, setItems] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [module, setModule] = useState("Tous modules")
  const [sortBy, setSortBy] = useState<SortColumn | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [moreOpen, setMoreOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const { data } = await auditService.getAuditLogsPage(undefined, { skip: 0, limit: 100 })
      if (data && data.length > 0) {
        const dynamicLogs: LogEntry[] = data.map((d, i) => ({
          id: d.id ? `LOG-${d.id.slice(0, 6)}` : `LOG-${1100 + i}`,
          date: d.timestamp ? new Date(d.timestamp).toLocaleString("fr-FR") : new Date().toLocaleString("fr-FR"),
          user: d.utilisateur || "Système",
          role: d.role || "Système",
          module: d.module || "Surveillance Flux",
          action: d.action || "Action enregistrée",
          result: (d.details || "").toLowerCase().includes("échec") || (d.action || "").toLowerCase().includes("échouée") ? "Échec" : "Succès",
          ip: d.ip_address || "127.0.0.1",
        }))
        setItems(dynamicLogs)
      } else {
        setItems([])
      }
    } catch (e) {
      console.warn("Erreur chargement logs audit :", e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (!selectedLog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedLog(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedLog])

  const toggleSort = (col: SortColumn) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(col)
      setSortDir("asc")
    }
  }

  const filtered = items.filter((l) => {
    const queryOk = !query || l.user.toLowerCase().includes(query.toLowerCase()) || l.action.toLowerCase().includes(query.toLowerCase())
    const moduleOk = module === "Tous modules" || l.module === module
    return queryOk && moduleOk
  })

  const sorted = [...filtered].sort((a, b) => {
    if (!sortBy) return 0
    const dir = sortDir === "asc" ? 1 : -1
    if (sortBy === "user") return a.user.localeCompare(b.user) * dir
    if (sortBy === "module") return a.module.localeCompare(b.module) * dir
    if (sortBy === "result") return a.result.localeCompare(b.result) * dir
    return a.date.localeCompare(b.date) * dir
  })

  const {
    data: pagedLogs,
    page: logsPage,
    setPage: setLogsPage,
    totalPages: logsTotalPages,
    total: logsTotal,
  } = usePageSlice(sorted, 20)

  const exportLogsCsv = () => {
    const headers = ["date", "user", "role", "module", "action", "result", "ip"]
    const escape = (val: string) => {
      const s = String(val ?? "")
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }
    const rows = items.map((l) =>
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
    toast.success("Journal exporté", { description: "Export CSV téléchargé." })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Journal d'audit</h1>
          <p className="mt-1 text-sm text-slate-500">Traçabilité complète des connexions, actions et décisions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
            title="Actualiser le journal"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={exportLogsCsv}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Entrées enregistrées", value: items.length, color: "#6366F1" },
          { label: "Tentatives échouées", value: items.filter((l) => l.result === "Échec").length, color: "#EF4444" },
          { label: "Actions réussies", value: items.filter((l) => l.result === "Succès").length, color: "#10B981" },
          { label: "Actions admin", value: items.filter((l) => l.role.toLowerCase().includes("admin") || l.role.toLowerCase().includes("responsable")).length, color: "#F59E0B" },
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
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Plus
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Modules</p>
                {moreModules.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setModule(m)
                      setMoreOpen(false)
                      toast.info("Filtre appliqué", { description: m })
                    }}
                    className={cn(
                      "block w-full rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-slate-50",
                      module === m ? "font-semibold text-indigo-700" : "text-slate-600"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log table */}
      <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <th className="px-5 py-3 font-semibold">
                  <button
                    onClick={() => toggleSort("date")}
                    className={cn(
                      "inline-flex items-center gap-1 transition cursor-pointer",
                      sortBy === "date" ? "text-indigo-600" : "hover:text-slate-600"
                    )}
                  >
                    Horodatage & Réf
                    <SortIcon column="date" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <button
                    onClick={() => toggleSort("user")}
                    className={cn(
                      "inline-flex items-center gap-1 transition cursor-pointer",
                      sortBy === "user" ? "text-indigo-600" : "hover:text-slate-600"
                    )}
                  >
                    Utilisateur
                    <SortIcon column="user" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">
                  <button
                    onClick={() => toggleSort("module")}
                    className={cn(
                      "inline-flex items-center gap-1 transition cursor-pointer",
                      sortBy === "module" ? "text-indigo-600" : "hover:text-slate-600"
                    )}
                  >
                    Module
                    <SortIcon column="module" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Action enregistrée</th>
                <th className="px-5 py-3 font-semibold text-right">
                  <button
                    onClick={() => toggleSort("result")}
                    className={cn(
                      "inline-flex items-center gap-1 transition cursor-pointer",
                      sortBy === "result" ? "text-indigo-600" : "hover:text-slate-600"
                    )}
                  >
                    Résultat
                    <SortIcon column="result" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {pagedLogs.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setSelectedLog(l)}
                  className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                >
                  <td className="px-5 py-3">
                    <p className="font-mono text-xs text-slate-800 dark:text-slate-200">{l.date}</p>
                    <p className="font-mono text-2xs text-indigo-600 dark:text-indigo-400 mt-0.5">{l.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{l.user}</p>
                    <p className="text-2xs text-slate-400">{l.role}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-2xs font-medium text-slate-600 dark:text-slate-300">
                      {l.module}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate" title={l.action}>
                    {l.action}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex flex-col items-end">
                      <StatusBadge
                        status={l.result === "Succès" ? "success" : "error"}
                        label={l.result}
                      />
                      <span className="font-mono text-2xs text-slate-400 mt-0.5">{l.ip}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logsTotal > 0 && (
          <DataPagination
            page={logsPage}
            totalPages={logsTotalPages}
            total={logsTotal}
            pageSize={20}
            onPageChange={setLogsPage}
            itemLabel="entrées"
            className="rounded-none border-x-0 border-b-0"
          />
        )}
      </div>

      {/* Log entry detail modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Entrée du journal</h3>
                <p className="mt-0.5 text-xs text-slate-400">{selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Full details */}
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Horodatage</span>
                <span className="font-mono text-slate-800">{selectedLog.date}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Utilisateur</span>
                <span className="font-medium text-slate-800">{selectedLog.user}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Rôle</span>
                <span className="text-slate-800">{selectedLog.role}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Module</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{selectedLog.module}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="shrink-0 text-slate-500">Action</span>
                <span className="text-right text-slate-800">{selectedLog.action}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Résultat</span>
                <Badge variant="outline" className={cn(
                  "border",
                  selectedLog.result === "Succès"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {selectedLog.result}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Adresse IP</span>
                <span className="font-mono text-slate-800">{selectedLog.ip}</span>
              </div>
            </div>

            {/* Additional context */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contexte additionnel
              </p>
              <div className="mt-2 space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Session ID</span>
                  <span className="font-mono text-slate-700">sess-{selectedLog.id.replace("LOG-", "")}-8f2a</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Terminal</span>
                  <span className="text-slate-700">Chrome 124 / Windows 11</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Localisation</span>
                  <span className="text-slate-700">
                    {selectedLog.ip.endsWith(".42") || selectedLog.ip.endsWith(".55")
                      ? "Bamako"
                      : selectedLog.ip.endsWith(".12")
                        ? "Sikasso"
                        : "Kayes"}
                  </span>
                </div>
              </div>
            </div>

            {/* Traçabilité note */}
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              Chaque accès est journalisé avec horodatage et origine.
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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

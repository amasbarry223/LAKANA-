"use client"

import { useState, useEffect } from "react"
import { Search, Download, ChevronDown, ArrowUp, ArrowDown, X, RefreshCw } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"
import { auditService, type ApiAuditLog } from "@/services/auditService"
import { DataPagination } from "@/components/ui/data-pagination"
import { usePaginatedFetch } from "@/hooks/use-pagination"
import { TableSkeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

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

function mapLogEntry(d: ApiAuditLog, i: number): LogEntry {
  return {
    id: d.id ? `LOG-${d.id.slice(0, 6)}` : `LOG-${1100 + i}`,
    date: d.timestamp ? new Date(d.timestamp).toLocaleString("fr-FR") : new Date().toLocaleString("fr-FR"),
    user: d.utilisateur || "Système",
    role: d.role || "Système",
    module: d.module || "Surveillance Flux",
    action: d.action || "Action enregistrée",
    result: (d.details || "").toLowerCase().includes("échec") || (d.action || "").toLowerCase().includes("échouée") ? "Échec" : "Succès",
    ip: d.ip_address || "127.0.0.1",
  }
}

const modules = ["Tous modules", "Authentification", "Centre d'alertes", "Client 360°", "Investigations", "Risk Score", "Filtrage sanctions", "Utilisateurs", "Journal d'audit", "Surveillance Flux"]

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

function SortIcon({ sortDir }: { sortDir: SortDir }) {
  const Icon: LucideIcon = sortDir === "asc" ? ArrowUp : ArrowDown
  return <Icon className="h-3 w-3" />
}

export function AuditLogView() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [module, setModule] = useState("Tous modules")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [moreOpen, setMoreOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)

  // Recherche différée de 300ms pour éviter une requête serveur à chaque frappe
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  // Tableau paginé côté serveur — source de vérité pour le journal affiché
  const {
    data: rawLogs,
    page: logsPage,
    setPage: setLogsPage,
    totalPages: logsTotalPages,
    total: logsTotal,
    loading,
    refetch: refetchLogs,
  } = usePaginatedFetch<ApiAuditLog>(
    ({ skip, limit }) =>
      auditService.getAuditLogsPage(
        {
          q: debouncedQuery || undefined,
          module: module === "Tous modules" ? undefined : module,
          order: sortDir,
        },
        { skip, limit }
      ),
    [debouncedQuery, module, sortDir],
    { pageSize: 20 }
  )
  const pagedLogs = rawLogs.map(mapLogEntry)

  // Instantané borné (200 entrées les plus récentes), découplé du tableau paginé,
  // utilisé uniquement pour les cartes de synthèse et l'export CSV rapide.
  const [statsSnapshot, setStatsSnapshot] = useState<LogEntry[]>([])
  useEffect(() => {
    auditService
      .getAuditLogsPage(undefined, { skip: 0, limit: 200 })
      .then(({ data }) => setStatsSnapshot(data.map(mapLogEntry)))
      .catch(() => setStatsSnapshot([]))
  }, [])

  useEffect(() => {
    if (!selectedLog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedLog(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedLog])

  const toggleDateSort = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"))

  const exportLogsCsv = () => {
    const headers = ["date", "user", "role", "module", "action", "result", "ip"]
    const escape = (val: string) => {
      const s = String(val ?? "")
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }
    const rows = statsSnapshot.map((l) =>
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
    toast.success("Journal exporté", { description: "Export CSV des 200 entrées les plus récentes téléchargé." })
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
            onClick={refetchLogs}
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
          { label: "Entrées enregistrées", value: logsTotal, color: "#070347" },
          { label: "Tentatives échouées (récent)", value: statsSnapshot.filter((l) => l.result === "Échec").length, color: "#CD0D29" },
          { label: "Actions réussies (récent)", value: statsSnapshot.filter((l) => l.result === "Succès").length, color: "#059669" },
          { label: "Actions admin (récent)", value: statsSnapshot.filter((l) => l.role.toLowerCase().includes("admin") || l.role.toLowerCase().includes("responsable")).length, color: "#D97706" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  s.color === "#070347" ? "bg-[#070347] dark:bg-indigo-400" : ""
                )}
                style={s.color !== "#070347" ? { background: s.color } : undefined}
              />
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
                    onClick={toggleDateSort}
                    className="inline-flex items-center gap-1 text-indigo-600 transition cursor-pointer"
                  >
                    Horodatage & Réf
                    <SortIcon sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 font-semibold">Utilisateur</th>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Action enregistrée</th>
                <th className="px-5 py-3 font-semibold text-right">Résultat</th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <TableSkeleton rows={8} cols={5} />
                  </td>
                </tr>
              </tbody>
            ) : pagedLogs.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="Aucune entrée trouvée"
                      description={
                        debouncedQuery || module !== "Tous modules"
                          ? "Aucun résultat pour ces filtres. Modifiez vos termes ou réinitialisez."
                          : "Aucune action n'a encore été journalisée."
                      }
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
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
            )}
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

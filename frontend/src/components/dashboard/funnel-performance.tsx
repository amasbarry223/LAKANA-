"use client"

import { useState, useMemo } from "react"
import { ChevronRight, ArrowUpRight, ArrowDownRight, Split, ShieldAlert, Activity, UserPlus, Gauge, FileSearch } from "lucide-react"
import { Line, LineChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { useDashboard, type AlertItem } from "@/lib/dashboard-context"
import { AlertDetailModal } from "@/components/dashboard/alert-detail-modal"

import { useEffect } from "react"
import { alertService } from "@/services/alertService"

const spark = (n: number, base: number, vol: number, trend: number) => {
  const arr: { v: number }[] = []
  for (let i = 0; i < n; i++) {
    arr.push({ v: base + trend * i + Math.sin(i * 1.3) * vol })
  }
  return arr
}

type AlertRow = AlertItem & {
  up: boolean
  delta: string
  color: string
  data: { v: number }[]
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Fractionnement: Split,
  "Filtrage sanctions": ShieldAlert,
  "Risk Score": Activity,
  Comportementale: Gauge,
}

const levelMap: Record<string, AlertItem["level"]> = {
  Bloquante: "bloquante",
  "À analyser": "analyser",
  Informative: "informative",
}

const moduleMap: Record<string, string> = {
  "Filtrage sanctions": "Filtrage sanctions",
  "Risk Score": "Risk Score",
  Fractionnement: "Fractionnement",
  Comportementale: "Comportementale",
}

function MiniSpark({ color, data }: { color: string; data: { v: number }[] }) {
  return (
    <div className="h-7 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FunnelPerformance() {
  const { filters } = useDashboard()
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null)
  const [fetchedAlerts, setFetchedAlerts] = useState<AlertRow[]>([])

  useEffect(() => {
    alertService.getAlerts().then((raw) => {
      if (raw && raw.length > 0) {
        const rows: AlertRow[] = raw.map((a, idx) => {
          const isBloquante = a.level === "bloquante"
          const color = isBloquante ? "#EF4444" : a.level === "analyser" ? "#F59E0B" : "#06B6D4"
          return {
            ref: a.ref,
            client: a.client,
            clientId: a.clientId,
            score: a.score,
            type: a.type,
            level: a.level,
            module: a.module,
            analyste: a.analyste,
            up: isBloquante || a.score >= 50,
            delta: `${Math.max(2, (a.score % 9) + 1)} pts`,
            color,
            data: spark(14, Math.max(30, a.score - 10), 2.5, 0.8),
            icon: MODULE_ICONS[a.module] || (isBloquante ? ShieldAlert : Activity),
          }
        })
        // Tri décroissant par score
        rows.sort((a, b) => b.score - a.score)
        setFetchedAlerts(rows)
      }
    }).catch(() => {})
  }, [])

  const alerts = useMemo(() => {
    return fetchedAlerts.filter((a) => {
      if (filters.level !== "Tous niveaux") {
        const mapped = levelMap[filters.level]
        if (mapped && a.level !== mapped) return false
      }
      if (filters.module !== "Tous modules") {
        const mapped = moduleMap[filters.module]
        if (mapped && a.module !== mapped) return false
      }
      if (filters.analyste !== "Tous analystes" && a.analyste !== filters.analyste) return false
      return true
    })
  }, [fetchedAlerts, filters])

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Alertes prioritaires</h3>
          <button
            onClick={() => navigateTo("Centre d'alertes")}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Tout voir
          </button>
        </div>

        {alerts.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-400">Aucune alerte pour ces filtres.</p>
        ) : (
          <div className="mt-4 space-y-1">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              <span>Client</span>
              <span className="text-right">Score</span>
              <span className="text-right">Tendance</span>
            </div>

            {alerts.map((a) => (
              <div
                key={a.ref}
                onClick={() => setSelectedAlert(a)}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${a.color}15` }}
                  >
                    <a.icon className="h-4 w-4" style={{ color: a.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{a.client}</p>
                    <p className="text-[11px] text-slate-400">
                      {a.ref} • {a.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{a.score}/100</p>
                  <p
                    className={cn(
                      "flex items-center justify-end gap-0.5 text-[11px] font-medium",
                      a.up ? "text-rose-600" : "text-emerald-600"
                    )}
                  >
                    {a.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {a.delta}
                  </p>
                </div>
                <MiniSpark color={a.color} data={a.data} />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigateTo("Centre d'alertes")}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Voir toutes les alertes
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {selectedAlert && (
        <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </>
  )
}

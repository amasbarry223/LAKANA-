"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, ChevronRight, ShieldCheck, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { navigateTo } from "@/lib/navigate"
import { cn } from "@/lib/utils"

import { statsService } from "@/services/statsService"

type Step = {
  name: string
  value: number
  pct: number
  color: string
}

// Valeurs de repli représentatives
const DEFAULT_STEPS: Step[] = [
  { name: "Transactions analysées", value: 1200, pct: 100, color: "#6366F1" },
  { name: "Correspondances PPE/sanctions", value: 120, pct: 10.0, color: "#7C8DF5" },
  { name: "Alertes générées", value: 45, pct: 3.8, color: "#06B6D4" },
  { name: "Investigations ouvertes", value: 12, pct: 1.0, color: "#22D3EE" },
  { name: "Décisions documentées", value: 8, pct: 0.7, color: "#5EEAD4" },
]

const fmt = (n: number) => n.toLocaleString("fr-FR")

export function FunnelChartWidget() {
  const [detailOpen, setDetailOpen] = useState(false)
  const [calibrated, setCalibrated] = useState(false)
  const [steps, setSteps] = useState<Step[]>(DEFAULT_STEPS)
  const [topReason, setTopReason] = useState<{ label: string; count: number } | null>(null)
  const [totalAlerts, setTotalAlerts] = useState<number | null>(null)

  useEffect(() => {
    statsService.getFunnelAnalytics().then((res) => {
      if (res?.steps && res.steps.length > 0) {
        setSteps(res.steps)
      }
      if (res?.reasons && res.reasons.length > 0) {
        setTopReason(res.reasons[0])
      }
      if (res?.total_alerts !== undefined) {
        setTotalAlerts(res.total_alerts)
      }
    }).catch(() => {})
  }, [])

  // Escape key closes the detail modal
  useEffect(() => {
    if (!detailOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [detailOpen])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              Pipeline de détection et traitement
            </h3>
            <Badge
              variant="outline"
              className="gap-1 border-indigo-200 bg-indigo-50 text-[11px] font-medium text-indigo-700"
            >
              <ShieldCheck className="h-3 w-3" />
              Conformité LBC/FT
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            5 étapes • Mise à jour il y a 12 minutes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDetailOpen(true)}
            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Détails
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => navigateTo("Paramètres")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
            title="Options du widget"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Pipeline bars */}
      <div className="mt-6 space-y-3">
        {steps.map((s, i) => {
          const prevPct = i === 0 ? 100 : steps[i - 1].pct
          const convRate = i === 0 ? 100 : (s.value / steps[i - 1].value) * 100
          return (
            <div key={s.name} className="group">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-700">{s.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900">{fmt(s.value)}</span>
                  <span className="w-12 text-right text-xs font-medium text-slate-500">
                    {s.pct}%
                  </span>
                </div>
              </div>
              <div className="relative h-9 w-full overflow-hidden rounded-lg bg-slate-50">
                <div
                  className="flex h-full items-center justify-end rounded-lg px-3 transition-all duration-500"
                  style={{
                    width: `${Math.max(s.pct, 4)}%`,
                    background: `linear-gradient(90deg, ${s.color}DD, ${s.color})`,
                  }}
                >
                  {i > 0 && (
                    <span className="text-[10px] font-medium text-white/90">
                      {convRate.toFixed(1)}% conv.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer stats */}
      <div className="mt-5 grid grid-cols-1 gap-2.5 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Taux d&#39;alerte global :</span>
          <span className="font-semibold text-indigo-600">
            {steps.length > 1
              ? `${steps[2]?.pct ?? "—"}%`
              : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Total traité :</span>
          <span className="font-semibold text-slate-900">
            {steps[0] ? fmt(steps[0].value) : "—"} transactions
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Plus grosse source :</span>
          <span className="font-semibold text-rose-600">
            {topReason
              ? `${topReason.label} (${topReason.count} alerte${topReason.count > 1 ? "s" : ""})`
              : totalAlerts !== null
              ? `${totalAlerts} alertes au total`
              : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Opportunité :</span>
          <button
            onClick={() => {
              setCalibrated(true)
              navigateTo("Filtrage sanctions/PPE")
            }}
            className={cn("font-semibold hover:underline", calibrated ? "text-emerald-600" : "text-indigo-600")}
          >
            {calibrated ? "Fuzzy matching calibré (FLT-02)" : "Calibrer le fuzzy matching PPE"}
          </button>
        </div>
      </div>

      <button
        onClick={() => navigateTo("Assistant IA")}
        className="mt-4 w-full rounded-lg border border-indigo-200 bg-indigo-50/50 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
      >
        Voir les insights conformité
      </button>

      {/* Pipeline detail modal */}
      {detailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Détails du pipeline de détection</h3>
                <p className="mt-0.5 text-xs text-slate-400">5 étapes de traitement LBC/FT — mise à jour il y a 12 min</p>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Steps detail */}
            <div className="mt-4 space-y-3">
              {steps.map((s, i) => {
                const convRate = i === 0 ? 100 : (s.value / steps[i - 1].value) * 100
                return (
                  <div key={s.name} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ background: s.color }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">{s.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{fmt(s.value)}</p>
                        <p className="text-[11px] text-slate-400">{s.pct}% du total</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(s.pct, 4)}%`,
                            background: `linear-gradient(90deg, ${s.color}DD, ${s.color})`,
                          }}
                        />
                      </div>
                      {i > 0 && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {convRate.toFixed(1)}% conv. depuis étape {i}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary footer */}
            <div className="mt-5 grid grid-cols-1 gap-2.5 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] text-slate-400">Total traité</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {steps[0] ? `${fmt(steps[0].value)} transactions` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Taux d&#39;alerte global</p>
                <p className="mt-0.5 text-sm font-semibold text-indigo-600">
                  {steps.length > 2 ? `${steps[2].pct}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Plus grosse source</p>
                <p className="mt-0.5 text-sm font-semibold text-rose-600">
                  {topReason ? `${topReason.label} (${topReason.count})` : "—"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDetailOpen(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
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

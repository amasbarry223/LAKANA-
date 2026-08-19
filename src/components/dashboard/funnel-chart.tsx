"use client"

import { MoreHorizontal, ChevronRight, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

type Step = {
  name: string
  value: number
  pct: number
  color: string
}

// Pipeline de traitement LBC/FT — section 8 du cahier des charges
const steps: Step[] = [
  { name: "Transactions analysées", value: 12847, pct: 100, color: "#6366F1" },
  { name: "Correspondances PPE/sanctions", value: 1203, pct: 9.4, color: "#7C8DF5" },
  { name: "Alertes générées", value: 456, pct: 3.5, color: "#06B6D4" },
  { name: "Investigations ouvertes", value: 124, pct: 1.0, color: "#22D3EE" },
  { name: "Décisions documentées", value: 89, pct: 0.7, color: "#5EEAD4" },
]

const fmt = (n: number) => n.toLocaleString("fr-FR")

export function FunnelChartWidget() {
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
            onClick={() => toast.info("Détails du pipeline", { description: "Vue détaillée des 5 étapes de traitement LBC/FT." })}
            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Détails
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => toast.info("Options du widget")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
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
          <span className="text-slate-500">Taux d'alerte global :</span>
          <span className="font-semibold text-indigo-600">3,55%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Total traité :</span>
          <span className="font-semibold text-slate-900">12 847</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Plus grosse source :</span>
          <span className="font-semibold text-rose-600">
            Fractionnement (167 alertes)
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Opportunité :</span>
          <button
            onClick={() => toast.success("Calibrage lancé", { description: "Le moteur de fuzzy matching PPE sera recalibré sur les variantes ouest-africaines (FLT-02)." })}
            className="font-semibold text-indigo-600 hover:underline"
          >
            Calibrer le fuzzy matching PPE
          </button>
        </div>
      </div>

      <button
        onClick={() => toast.info("Insights conformité", { description: "Redirection vers les insights du Centre d'alertes." })}
        className="mt-4 w-full rounded-lg border border-indigo-200 bg-indigo-50/50 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
      >
        Voir les insights conformité
      </button>
    </div>
  )
}

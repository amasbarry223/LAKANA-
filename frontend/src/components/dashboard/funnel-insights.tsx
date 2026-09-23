"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle2, ChevronRight, ShieldAlert, FileText } from "lucide-react"
import { navigateTo } from "@/lib/navigate"
import { statsService } from "@/services/statsService"

type Insight = {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  title: string
  desc: string
  accent: string
  target: string
  clientId?: string
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileText,
}

export function FunnelInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsService.getFunnelAnalytics().then((res) => {
      if (res?.insights && res.insights.length > 0) {
        const mapped: Insight[] = res.insights.map((ins) => ({
          icon: ICON_MAP[ins.icon] || AlertTriangle,
          iconBg: ins.iconBg,
          iconColor: ins.iconColor,
          title: ins.title,
          desc: ins.desc,
          accent: ins.accent,
          target: ins.target,
          clientId: ins.clientId,
        }))
        setInsights(mapped)
      }
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Signaux de conformité</h3>
        <button
          onClick={() => navigateTo("Centre d'alertes")}
          className="text-xs font-semibold text-indigo-600 hover:underline"
        >
          Tout voir
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {insights.map((ins) => (
          <div
            key={ins.title}
            className="group flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 transition hover:border-slate-200 hover:bg-slate-50/50"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ins.iconBg}`}
            >
              <ins.icon className={`h-[18px] w-[18px] ${ins.iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{ins.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {ins.desc}
              </p>
              <button
                onClick={() =>
                  navigateTo(ins.target, ins.clientId ? { clientId: ins.clientId } : undefined)
                }
                className={`mt-2 inline-flex items-center gap-0.5 text-xs font-semibold ${ins.accent} hover:underline`}
              >
                Voir le détail
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-center">
        <p className="text-[11px] leading-relaxed text-slate-400">
          L'assistant IA rappelle que la décision finale revient à l'analyste
          habilité.
        </p>
      </div>
    </div>
  )
}

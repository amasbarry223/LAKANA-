"use client"

import { AlertTriangle, Sparkles, Trophy, ChevronRight } from "lucide-react"
import { navigateTo } from "@/lib/navigate"

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

const insights: Insight[] = [
  {
    icon: AlertTriangle,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    title: "Score critique détecté",
    desc: "Le client Traoré M. a atteint un score de 87/100 — investigation requise.",
    accent: "text-rose-600",
    target: "Investigations",
    clientId: "CLI-1042",
  },
  {
    icon: Sparkles,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-500",
    title: "Correspondances PPE en attente",
    desc: "3 correspondances PPE nécessitent une revue humaine avant tout blocage.",
    accent: "text-cyan-600",
    target: "Filtrage sanctions/PPE",
  },
  {
    icon: Trophy,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    title: "Investigation clôturée",
    desc: "L'alerte ALR-124 a été classée et tracée dans le journal d'audit.",
    accent: "text-emerald-600",
    target: "Journal d'audit",
  },
]

export function FunnelInsights() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Insights conformité</h3>
        <button
          onClick={() => navigateTo("Assistant IA")}
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

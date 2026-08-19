"use client"

import { AlertTriangle, Sparkles, Trophy, ChevronRight } from "lucide-react"

type Insight = {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  title: string
  desc: string
  accent: string
}

const insights: Insight[] = [
  {
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    title: "High Drop-off Detected",
    desc: "Users drop by 27.8% at the Email Verification step.",
    accent: "text-amber-600",
  },
  {
    icon: Sparkles,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-500",
    title: "Optimization Opportunity",
    desc: "Users who add a payment method convert 3.2x higher.",
    accent: "text-cyan-600",
  },
  {
    icon: Trophy,
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-500",
    title: "Winning Segment",
    desc: "Users from Organic Search convert 3.4x better.",
    accent: "text-yellow-600",
  },
]

export function FunnelInsights() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Funnel Insights</h3>
        <button className="text-xs font-semibold text-indigo-600 hover:underline">
          View All
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
                className={`mt-2 inline-flex items-center gap-0.5 text-xs font-semibold ${ins.accent} hover:underline`}
              >
                View Insight
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

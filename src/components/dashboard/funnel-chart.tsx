"use client"

import { MoreHorizontal, ChevronRight, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Step = {
  name: string
  value: number
  pct: number
  color: string
}

const steps: Step[] = [
  { name: "Sign Up", value: 63212, pct: 100, color: "#6366F1" },
  { name: "Email Verified", value: 45631, pct: 72.2, color: "#7C8DF5" },
  { name: "Onboarding Started", value: 28942, pct: 45.8, color: "#06B6D4" },
  { name: "Add Payment Method", value: 12842, pct: 20.3, color: "#22D3EE" },
  { name: "Subscribed", value: 7888, pct: 12.5, color: "#5EEAD4" },
]

const fmt = (n: number) => n.toLocaleString("en-US")

export function FunnelChartWidget() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              Signup to Paid Conversion Funnel
            </h3>
            <Badge
              variant="outline"
              className="gap-1 border-indigo-200 bg-indigo-50 text-[11px] font-medium text-indigo-700"
            >
              <ShieldCheck className="h-3 w-3" />
              Premium Verified
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            5 Steps • Last updated 2 hours ago
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
            View Funnel
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Funnel bars */}
      <div className="mt-6 space-y-3">
        {steps.map((s, i) => {
          const prevPct = i === 0 ? 100 : steps[i - 1].pct
          const stepDrop = i === 0 ? 0 : prevPct - s.pct
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
                    width: `${s.pct}%`,
                    background: `linear-gradient(90deg, ${s.color}DD, ${s.color})`,
                  }}
                >
                  {i > 0 && (
                    <span className="text-[10px] font-medium text-white/90">
                      -{stepDrop.toFixed(1)}%
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
          <span className="text-slate-500">Overall Conversion Rate:</span>
          <span className="font-semibold text-indigo-600">12.48%</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Total Drop-offs:</span>
          <span className="font-semibold text-slate-900">55,324</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Biggest Drop-off:</span>
          <span className="font-semibold text-rose-600">
            Email Verified → Onboarding (16,680)
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Improvement Opportunity:</span>
          <button className="font-semibold text-indigo-600 hover:underline">
            Add Payment Method step
          </button>
        </div>
      </div>

      <button className="mt-4 w-full rounded-lg border border-indigo-200 bg-indigo-50/50 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50">
        View Insights
      </button>
    </div>
  )
}

"use client"

import { ArrowUp, ArrowDown } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"

type Metric = {
  label: string
  value: string
  delta: string
  positive: boolean
  // when true, a downward delta is good (e.g. fewer alerts = good)
  invertDelta?: boolean
  chartColor: string
  chartId: string
  data: { v: number }[]
}

const seed = (n: number, start: number, end: number, vol: number) => {
  const arr: { v: number }[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const trend = start + (end - start) * t
    arr.push({ v: Math.max(0, trend + Math.sin(i * 1.7) * vol) })
  }
  return arr
}

const metrics: Metric[] = [
  {
    label: "Alertes bloquantes",
    value: "24",
    delta: "12% vs hier",
    positive: false,
    chartColor: "#EF4444",
    chartId: "m1",
    data: seed(16, 18, 24, 2),
    nav: "Centre d'alertes",
  },
  {
    label: "Alertes à analyser",
    value: "87",
    delta: "5% vs hier",
    positive: true,
    invertDelta: true,
    chartColor: "#F59E0B",
    chartId: "m2",
    nav: "Centre d'alertes",
    data: seed(16, 102, 87, 5),
  },
  {
    label: "Score moyen",
    value: "42/100",
    delta: "3 pts vs hier",
    positive: false,
    chartColor: "#6366F1",
    chartId: "m3",
    nav: "Risk Score",
    data: seed(16, 36, 42, 2.5),
  },
  {
    label: "Temps moyen traitement",
    value: "4h 32min",
    delta: "18% vs hier",
    positive: true,
    invertDelta: true,
    chartColor: "#10B981",
    chartId: "m4",
    nav: "Investigations",
    data: seed(16, 5.8, 4.5, 0.4),
  },
  {
    label: "Taux faux positifs",
    value: "23%",
    delta: "4% vs hier",
    positive: true,
    invertDelta: true,
    chartColor: "#06B6D4",
    chartId: "m5",
    nav: "Filtrage sanctions/PPE",
    data: seed(16, 29, 23, 1.8),
  },
]

function Sparkline({ color, data, id }: { color: string; data: { v: number }[]; id: string }) {
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MetricCards() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {metrics.map((m) => {
        const good = m.invertDelta ? m.positive : !m.positive
        return (
          <div
            key={m.label}
            onClick={() => m.nav && navigateTo(m.nav)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
          >
            <p className="text-[13px] font-medium text-slate-500">{m.label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
              {m.value}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-xs font-semibold",
                  good ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}
              >
                {good ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )}
                {m.delta.split(" ")[0]}
              </span>
              <span className="text-[11px] text-slate-400">{m.delta.split(" ").slice(1).join(" ")}</span>
            </div>
            <div className="mt-3 -mx-1">
              <Sparkline color={m.chartColor} data={m.data} id={m.chartId} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

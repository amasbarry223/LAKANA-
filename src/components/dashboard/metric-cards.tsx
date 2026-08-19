"use client"

import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

type Metric = {
  label: string
  value: string
  delta: string
  positive: boolean
  // when true, a downward delta is good (green) — e.g. faster time
  invertDelta?: boolean
  chartColor: string
  chartId: string
  data: { v: number }[]
}

const seed = (n: number, start: number, end: number, vol: number) => {
  const arr: { v: number }[] = []
  let v = start
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const trend = start + (end - start) * t
    v = trend + (Math.sin(i * 1.7) * vol)
    arr.push({ v: Math.max(0, v) })
  }
  return arr
}

const metrics: Metric[] = [
  {
    label: "Overall Conversion Rate",
    value: "12.48%",
    delta: "18.0% vs Apr 30",
    positive: true,
    chartColor: "#6366F1",
    chartId: "m1",
    data: seed(16, 9, 12.5, 1.2),
  },
  {
    label: "Total Completions",
    value: "8,540",
    delta: "$12.3k vs Apr 30",
    positive: true,
    chartColor: "#14B8A6",
    chartId: "m2",
    data: seed(16, 6000, 8540, 600),
  },
  {
    label: "Total Users",
    value: "68,412",
    delta: "14.7% vs Apr 30",
    positive: true,
    chartColor: "#3B82F6",
    chartId: "m3",
    data: seed(16, 52000, 68412, 3500),
  },
  {
    label: "Avg. Time to Convert",
    value: "2d 14h",
    delta: "5.3% vs Apr 30",
    positive: true,
    invertDelta: true,
    chartColor: "#10B981",
    chartId: "m4",
    data: seed(16, 3.2, 2.6, 0.4),
  },
  {
    label: "Abandonment Rate",
    value: "67.52%",
    delta: "6.1% vs Apr 30",
    positive: false,
    chartColor: "#EF4444",
    chartId: "m5",
    data: seed(16, 60, 67.5, 2.5),
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
        const good = m.invertDelta ? true : m.positive
        return (
          <div
            key={m.label}
            className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
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
                {m.invertDelta ? (
                  <ArrowDown className="h-3 w-3" />
                ) : m.positive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )}
                {m.delta.split(" ")[0]}
              </span>
              <span className="text-[11px] text-slate-400">vs Apr 30</span>
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

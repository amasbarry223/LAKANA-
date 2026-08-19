"use client"

import { useState } from "react"
import { MoreHorizontal, ChevronDown } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"
import { toast } from "sonner"

type Series = {
  key: string
  name: string
  color: string
}

// Niveaux d'alerte — ALR-01 : bloquante, à analyser, informative
const series: Series[] = [
  { key: "bloquante", name: "Bloquante", color: "#EF4444" },
  { key: "analyser", name: "À analyser", color: "#F59E0B" },
  { key: "informative", name: "Informative", color: "#06B6D4" },
]

const dates: string[] = []
const start = new Date("2026-07-07")
for (let i = 0; i <= 49; i += 4) {
  const d = new Date(start)
  d.setDate(start.getDate() + i)
  dates.push(d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }))
}

const data = dates.map((date, i) => ({
  date,
  bloquante: Math.round(18 + Math.sin(i * 0.9) * 6 + i * 0.2),
  analyser: Math.round(80 + Math.sin(i * 0.7) * 15 + i * 0.3),
  informative: Math.round(45 + Math.sin(i * 0.6 + 1) * 12),
}))

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="mb-1.5 text-xs font-semibold text-slate-700">{label}</p>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-slate-500">{p.name}</span>
            <span className="ml-auto font-semibold text-slate-900">
              {p.value} alertes
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TrendChartWidget() {
  const [metric, setMetric] = useState("Volume d'alertes")
  const [granularity, setGranularity] = useState("Jour")

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Évolution des alertes
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Par niveau de criticité • 7 juil. - 25 août 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMetric(metric === "Volume d'alertes" ? "Risk Score moyen" : "Volume d'alertes")}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {metric}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          <button
            onClick={() => setGranularity(granularity === "Jour" ? "Semaine" : "Jour")}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {granularity}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          <button onClick={() => toast.info("Options du graphique")} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`tg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
              domain={[0, 120]}
              ticks={[0, 30, 60, 90, 120]}
            />
            <Tooltip content={<CustomTooltip />} />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#tg-${s.key})`}
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            ))}
            <Legend
              verticalAlign="top"
              align="right"
              height={28}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

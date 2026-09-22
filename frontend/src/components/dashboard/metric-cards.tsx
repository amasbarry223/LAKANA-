"use client"

import { useState, useEffect } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { useDashboard } from "@/lib/dashboard-context"
import { statsService } from "@/services/statsService"

type Metric = {
  label: string
  value: string
  delta: string
  positive: boolean
  invertDelta?: boolean
  chartColor: string
  chartId: string
  data: { v: number }[]
  nav?: string
}

const CHART_COLORS = ["#EF4444", "#F59E0B", "#6366F1", "#10B981", "#06B6D4"]
const NAVS = [
  "Centre d'alertes",
  "Centre d'alertes",
  "Risk Score",
  "Investigations",
  "Filtrage sanctions/PPE",
]

function buildSparkline(current: number, n = 16, vol = 2): { v: number }[] {
  const arr: { v: number }[] = []
  const start = Math.max(0, current * 0.75)
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    arr.push({ v: Math.max(0, start + (current - start) * t + Math.sin(i * 1.7) * vol) })
  }
  return arr
}

const FALLBACK_METRICS: Metric[] = [
  {
    label: "Alertes bloquantes",
    value: "—",
    delta: "— vs hier",
    positive: false,
    chartColor: CHART_COLORS[0],
    chartId: "m1",
    data: [],
    nav: NAVS[0],
  },
  {
    label: "Alertes à analyser",
    value: "—",
    delta: "— vs hier",
    positive: true,
    invertDelta: true,
    chartColor: CHART_COLORS[1],
    chartId: "m2",
    data: [],
    nav: NAVS[1],
  },
  {
    label: "Score moyen",
    value: "—",
    delta: "— pts vs hier",
    positive: false,
    chartColor: CHART_COLORS[2],
    chartId: "m3",
    data: [],
    nav: NAVS[2],
  },
  {
    label: "Temps moyen traitement",
    value: "—",
    delta: "— vs hier",
    positive: true,
    invertDelta: true,
    chartColor: CHART_COLORS[3],
    chartId: "m4",
    data: [],
    nav: NAVS[3],
  },
  {
    label: "Investigations en cours",
    value: "—",
    delta: "— vs hier",
    positive: false,
    chartColor: CHART_COLORS[4],
    chartId: "m5",
    data: [],
    nav: NAVS[4],
  },
]

function Sparkline({ color, data, id }: { color: string; data: { v: number }[]; id: string }) {
  if (data.length === 0) return <div className="h-10 w-full" />
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
  const { compareMode } = useDashboard()
  const [metrics, setMetrics] = useState<Metric[]>(FALLBACK_METRICS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsService.getDashboardOverview().then((res) => {
      const s = res.stats
      // Score moyen : extraire la partie numérique "56/100" -> 56
      const scoreParts = (s.score_moyen || "0/100").split("/")
      const scoreNum = parseInt(scoreParts[0] || "0", 10)

      const bloquantes = s.alertes_bloquantes ?? 0
      const aAnalyser = s.alertes_analyser ?? (s.alertes_actives - (s.alertes_bloquantes ?? 0))
      const investigations = s.investigations_en_cours ?? 0

      setMetrics([
        {
          label: "Alertes bloquantes",
          value: String(bloquantes),
          delta: `${bloquantes > 0 ? "+" + bloquantes : bloquantes} ce jour`,
          positive: bloquantes === 0,
          chartColor: CHART_COLORS[0],
          chartId: "m1",
          data: buildSparkline(bloquantes, 16, 1.5),
          nav: NAVS[0],
        },
        {
          label: "Alertes à analyser",
          value: String(Math.max(0, aAnalyser)),
          delta: `${aAnalyser} actives`,
          positive: aAnalyser < 50,
          invertDelta: true,
          chartColor: CHART_COLORS[1],
          chartId: "m2",
          data: buildSparkline(Math.max(0, aAnalyser), 16, 3),
          nav: NAVS[1],
        },
        {
          label: "Score moyen",
          value: s.score_moyen || "—",
          delta: `${scoreNum > 50 ? "↑" : "↓"} ${scoreNum} pts`,
          positive: scoreNum <= 50,
          chartColor: CHART_COLORS[2],
          chartId: "m3",
          data: buildSparkline(scoreNum, 16, 2),
          nav: NAVS[2],
        },
        {
          label: "Temps moyen traitement",
          value: "—",
          delta: "N/A",
          positive: true,
          invertDelta: true,
          chartColor: CHART_COLORS[3],
          chartId: "m4",
          data: buildSparkline(4, 16, 0.4),
          nav: NAVS[3],
        },
        {
          label: "Investigations en cours",
          value: String(investigations),
          delta: `${investigations} dossiers actifs`,
          positive: investigations === 0,
          chartColor: CHART_COLORS[4],
          chartId: "m5",
          data: buildSparkline(investigations, 16, 1),
          nav: NAVS[4],
        },
      ])
    }).catch(() => {
      // Garder les valeurs de repli
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {metrics.map((m) => {
        const good = m.invertDelta ? m.positive : !m.positive
        const compareDelta = compareMode
          ? m.positive
            ? "−3% vs période préc."
            : "+2% vs période préc."
          : m.delta
        return (
          <div
            key={m.label}
            onClick={() => m.nav && navigateTo(m.nav)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
          >
            <p className="text-[13px] font-medium text-slate-500">{m.label}</p>
            <p className={cn("mt-1.5 text-2xl font-bold tracking-tight text-slate-900", loading && "animate-pulse text-slate-300")}>
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
                {compareDelta.split(" ")[0]}
              </span>
              <span className="text-[11px] text-slate-400">{compareDelta.split(" ").slice(1).join(" ")}</span>
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

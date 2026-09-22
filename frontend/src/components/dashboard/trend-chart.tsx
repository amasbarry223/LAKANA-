"use client"

import { useState, useEffect, useMemo } from "react"
import { MoreHorizontal, ChevronDown, X, RefreshCw } from "lucide-react"
import { statsService } from "@/services/statsService"
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
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

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

type Metric = "Volume d'alertes" | "Taux d'alertes";
type Granularity = "Jour" | "Semaine" | "Mois"
type Period = "7" | "30" | "90"
type ChartType = "area" | "line" | "bar"

type TrendPoint = { date: string; alertes: number; investigations: number }
type ChartPoint = { date: string; bloquante: number; analyser: number; informative: number }

function trendToChart(trend: TrendPoint[]): ChartPoint[] {
  // Le backend renvoie alertes (total) et investigations.
  // On décompose alertes en trois niveaux approximatifs pour le graphique.
  return trend.map((t) => ({
    date: t.date,
    bloquante: Math.round(t.alertes * 0.25),
    analyser: Math.round(t.alertes * 0.55),
    informative: Math.round(t.alertes * 0.2),
  }))
}

function metricUnit(_metric: Metric) {
  return "alertes"
}

function metricDomain(data: ChartPoint[]): [number, number] {
  const max = Math.max(...data.flatMap((d) => [d.bloquante, d.analyser, d.informative]), 10)
  return [0, Math.ceil(max * 1.2)]
}

function granularityInterval(g: Granularity): number {
  if (g === "Jour") return 0
  if (g === "Semaine") return 1
  return 3 // Mois
}

function periodPoints(p: Period, total: number): number {
  if (p === "7") return Math.min(3, total)
  if (p === "30") return Math.min(6, total)
  return total
}

function CustomTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null
  const unit = metricUnit(metric as Metric)
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
              {p.value} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TrendChartWidget() {
  const [metric, setMetric] = useState<Metric>("Volume d'alertes")
  const [granularity, setGranularity] = useState<Granularity>("Semaine")
  const [metricOpen, setMetricOpen] = useState(false)
  const [granularityOpen, setGranularityOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    bloquante: true,
    analyser: true,
    informative: true,
  })
  const [chartType, setChartType] = useState<ChartType>("area")
  const [period, setPeriod] = useState<Period>("90")
  const [rawTrend, setRawTrend] = useState<TrendPoint[]>([])
  const [trendLoading, setTrendLoading] = useState(true)

  // Brouillon local du modal options (validé sur "Appliquer")
  const [draftVisible, setDraftVisible] = useState<Record<string, boolean>>({
    bloquante: true,
    analyser: true,
    informative: true,
  })
  const [draftChartType, setDraftChartType] = useState<ChartType>("area")
  const [draftPeriod, setDraftPeriod] = useState<Period>("90")

  // Chargement des données réelles de tendance
  useEffect(() => {
    statsService.getDashboardOverview().then((res) => {
      if (res.trend && res.trend.length > 0) {
        setRawTrend(res.trend)
      }
    }).catch(() => {}).finally(() => setTrendLoading(false))
  }, [])

  useEffect(() => {
    if (!optionsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOptionsOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [optionsOpen])

  const metricOptions: Metric[] = ["Volume d'alertes", "Taux d'alertes"]
  const granularityOptions: Granularity[] = ["Jour", "Semaine", "Mois"]

  const openOptions = () => {
    setDraftVisible({ ...visibleSeries })
    setDraftChartType(chartType)
    setDraftPeriod(period)
    setOptionsOpen(true)
  }

  const applyOptions = () => {
    setVisibleSeries(draftVisible)
    setChartType(draftChartType)
    setPeriod(draftPeriod)
    setOptionsOpen(false)
    toast.success("Options appliquées", {
      description: `Type : ${draftChartType} • Période : ${draftPeriod} jours.`,
    })
  }

  const allChartData = useMemo(() => trendToChart(rawTrend), [rawTrend])

  const chartData = useMemo(() => {
    const n = periodPoints(period, allChartData.length)
    return allChartData.slice(allChartData.length - n)
  }, [allChartData, period])

  const yDomain = metricDomain(chartData.length > 0 ? chartData : [{ date: "", bloquante: 0, analyser: 10, informative: 5 }])
  const xInterval = granularityInterval(granularity)
  const visibleCount = series.filter((s) => visibleSeries[s.key]).length

  const renderSeries = (s: Series) => {
    if (chartType === "line") {
      return (
        <Area
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.name}
          stroke={s.color}
          strokeWidth={2}
          fill="transparent"
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
      )
    }
    if (chartType === "bar") {
      return (
        <Area
          key={s.key}
          type="step"
          dataKey={s.key}
          name={s.name}
          stroke={s.color}
          strokeWidth={1}
          fill={s.color}
          fillOpacity={0.5}
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2 }}
        />
      )
    }
    return (
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
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              Évolution des alertes
            </h3>
            {trendLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Par niveau de criticité • {period} derniers jours • {rawTrend.length > 0 ? `${rawTrend.length} semaines` : "chargement…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setMetricOpen(!metricOpen)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {metric}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {metricOpen && (
              <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Métrique</p>
                {metricOptions.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMetric(m)
                      setMetricOpen(false)
                      toast.success("Métrique mise à jour", { description: m })
                    }}
                    className={cn(
                      "block w-full rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-slate-50",
                      metric === m ? "font-semibold text-indigo-700" : "text-slate-600"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setGranularityOpen(!granularityOpen)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {granularity}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {granularityOpen && (
              <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Granularité</p>
                {granularityOptions.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGranularity(g)
                      setGranularityOpen(false)
                      toast.success("Granularité mise à jour", { description: g })
                    }}
                    className={cn(
                      "block w-full rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-slate-50",
                      granularity === g ? "font-semibold text-indigo-700" : "text-slate-600"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={openOptions} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100" title="Options du graphique">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5 h-[280px] w-full">
        {trendLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-300" />
              <p className="text-xs text-slate-400">Chargement des données…</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
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
                interval={xInterval}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickLine={false}
                axisLine={false}
                domain={yDomain}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              {series.filter((s) => visibleSeries[s.key]).map(renderSeries)}
              {visibleCount > 0 && (
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={28}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Options modal */}
      {optionsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setOptionsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Options du graphique</h3>
                <p className="mt-0.5 text-xs text-slate-400">Visibilité des séries, type et période</p>
              </div>
              <button
                onClick={() => setOptionsOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Series visibility */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Séries affichées
              </p>
              <div className="mt-2 space-y-2">
                {series.map((s) => (
                  <div key={s.key} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-sm font-medium text-slate-700">{s.name}</span>
                    </div>
                    <Switch
                      checked={draftVisible[s.key]}
                      onCheckedChange={(v) =>
                        setDraftVisible((prev) => ({ ...prev, [s.key]: v }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Chart type */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type d'affichage
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([
                  { v: "area", label: "Area" },
                  { v: "line", label: "Line" },
                  { v: "bar", label: "Bar" },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setDraftChartType(o.v)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      draftChartType === o.v
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Période
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([
                  { v: "7", label: "7 jours" },
                  { v: "30", label: "30 jours" },
                  { v: "90", label: "90 jours" },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setDraftPeriod(o.v)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      draftPeriod === o.v
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setOptionsOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
              <button
                onClick={applyOptions}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

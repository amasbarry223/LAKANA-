"use client"

import { MetricCards } from "@/components/dashboard/metric-cards"
import { FilterBar } from "@/components/dashboard/filter-bar"
import { FunnelChartWidget } from "@/components/dashboard/funnel-chart"
import { TrendChartWidget } from "@/components/dashboard/trend-chart"
import { FunnelPerformance } from "@/components/dashboard/funnel-performance"
import { DropoffReasons } from "@/components/dashboard/dropoff-reasons"
import { FunnelInsights } from "@/components/dashboard/funnel-insights"

export function AlertsCenterView() {
  return (
    <div className="space-y-5">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
          Centre d'alertes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Surveillez, priorisez et traitez les alertes de conformité LBC/FT/FP.
        </p>
      </div>

      {/* Metric cards */}
      <MetricCards />

      {/* Filter bar */}
      <FilterBar />

      {/* Row 3: Funnel chart (wide) | Performance + Drop-off (stacked) */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <FunnelChartWidget />
        </div>
        <div className="flex flex-col gap-5 xl:col-span-1">
          <FunnelPerformance />
          <DropoffReasons />
        </div>
      </div>

      {/* Row 4: Trend chart (wide) | Insights */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendChartWidget />
        </div>
        <div className="xl:col-span-1">
          <FunnelInsights />
        </div>
      </div>
    </div>
  )
}

"use client"

import { MetricCards } from "@/components/dashboard/metric-cards"
import { FilterBar } from "@/components/dashboard/filter-bar"
import { FunnelChartWidget } from "@/components/dashboard/funnel-chart"
import { TrendChartWidget } from "@/components/dashboard/trend-chart"
import { FunnelPerformance } from "@/components/dashboard/funnel-performance"
import { DropoffReasons } from "@/components/dashboard/dropoff-reasons"
import { FunnelInsights } from "@/components/dashboard/funnel-insights"
import { useDashboard } from "@/lib/dashboard-context"
import { cn } from "@/lib/utils"

export function AlertsCenterView() {
  const { compareMode, alertsView, dateRangeLabel } = useDashboard()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
          Centre d'alertes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Surveillez, priorisez et traitez les alertes de conformité LBC/FT/FP.
          <span className="ml-2 text-slate-400">· {dateRangeLabel}</span>
        </p>
      </div>

      {compareMode && (
        <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800">
          <span className="font-semibold">Mode comparaison</span>
          <span className="text-indigo-600">— Période précédente : alertes bloquantes −8%, score moyen −2 pts</span>
        </div>
      )}

      <MetricCards />

      <FilterBar />

      <div
        data-alerts-widgets
        className={cn(
          "space-y-5",
          alertsView === "list" && "max-w-3xl"
        )}
      >
        <div
          className={cn(
            "grid grid-cols-1 gap-5",
            alertsView === "grid" && "xl:grid-cols-3"
          )}
        >
          <div className={cn(alertsView === "grid" && "xl:col-span-2")}>
            <FunnelChartWidget />
          </div>
          <div
            className={cn(
              "flex flex-col gap-5",
              alertsView === "grid" && "xl:col-span-1"
            )}
          >
            <FunnelPerformance />
            {alertsView === "grid" && <DropoffReasons />}
          </div>
        </div>

        <div
          className={cn(
            "grid grid-cols-1 gap-5",
            alertsView === "grid" && "xl:grid-cols-3"
          )}
        >
          <div className={cn(alertsView === "grid" && "xl:col-span-2")}>
            <TrendChartWidget />
          </div>
          <div className={cn(alertsView === "grid" && "xl:col-span-1")}>
            <FunnelInsights />
          </div>
        </div>

        {alertsView === "list" && <DropoffReasons />}
      </div>
    </div>
  )
}

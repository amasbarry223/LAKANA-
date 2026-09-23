"use client"

import React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MetricCardProps {
  value: string | number
  label?: string
  title?: string
  trend?: string
  trendLabel?: string
  subtitle?: string
  icon?: React.ReactNode | React.ElementType
  color?: "indigo" | "emerald" | "amber" | "rose" | "blue" | "slate"
  variant?: "default" | "warning" | "danger" | "success" | "neutral" | string
  change?: string
  onClick?: () => void
  className?: string
}

const colorMap = {
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  slate: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
  },
}

export function MetricCard({
  value,
  label,
  title,
  trend,
  trendLabel,
  subtitle,
  icon: Icon,
  color,
  variant,
  change,
  onClick,
  className,
}: MetricCardProps) {
  const displayLabel = label || title || ""
  const activeTrend = trend || change
  const isPositive = activeTrend && !activeTrend.startsWith("-")

  // Mapping variant vers color
  let activeColor: keyof typeof colorMap = color || "indigo"
  if (variant === "danger") activeColor = "rose"
  else if (variant === "warning") activeColor = "amber"
  else if (variant === "success") activeColor = "emerald"
  else if (variant === "neutral") activeColor = "slate"

  const colorStyles = colorMap[activeColor] || colorMap.indigo

  const renderIcon = () => {
    if (!Icon) return null
    if (React.isValidElement(Icon)) return Icon
    if (typeof Icon === "function" || typeof Icon === "object") {
      const Comp = Icon as React.ElementType
      return <Comp className="h-4 w-4" />
    }
    return null
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900/90",
        onClick && "cursor-pointer hover:border-slate-300 hover:shadow-sm dark:hover:border-slate-700",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {displayLabel}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform",
              colorStyles.bg,
              colorStyles.text
            )}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </div>

      {(activeTrend || subtitle || trendLabel) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {activeTrend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {activeTrend}
            </span>
          )}
          {trendLabel && (
            <span className="text-slate-400 dark:text-slate-500">{trendLabel}</span>
          )}
          {subtitle && !activeTrend && (
            <span className="text-slate-400 dark:text-slate-500">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  )
}

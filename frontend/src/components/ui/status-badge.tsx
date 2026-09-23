"use client"

import React from "react"
import { cn } from "@/lib/utils"

export type StatusVariant =
  | "active"
  | "inactive"
  | "pending"
  | "error"
  | "success"
  | "warning"
  | "danger"
  | "neutral"

export interface StatusBadgeProps {
  status?: StatusVariant | string
  variant?: StatusVariant | string
  label?: string
  children?: React.ReactNode
  dot?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const statusMap: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  active: {
    label: "Actif",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    dotClass: "bg-emerald-500",
  },
  success: {
    label: "Succès",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    dotClass: "bg-emerald-500",
  },
  cloturee: {
    label: "Clôturée",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    dotClass: "bg-emerald-500",
  },
  inactive: {
    label: "Inactif",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  neutral: {
    label: "Classé",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  classee: {
    label: "Classée",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  informative: {
    label: "Informative",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    dotClass: "bg-emerald-500",
  },
  pending: {
    label: "En attente",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    dotClass: "bg-amber-500",
  },
  warning: {
    label: "À analyser",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    dotClass: "bg-amber-500",
  },
  analyser: {
    label: "À analyser",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    dotClass: "bg-amber-500",
  },
  en_cours: {
    label: "En cours",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    dotClass: "bg-amber-500",
  },
  error: {
    label: "Erreur",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    dotClass: "bg-rose-500",
  },
  danger: {
    label: "Bloquante",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    dotClass: "bg-rose-500",
  },
  bloquante: {
    label: "Bloquante",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    dotClass: "bg-rose-500",
  },
  transmise: {
    label: "Transmise",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    dotClass: "bg-rose-500",
  },
  nouvelle: {
    label: "Nouvelle",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
    dotClass: "bg-indigo-500",
  },
}

export function StatusBadge({
  status,
  variant,
  label,
  children,
  dot = true,
  size = "md",
  className,
}: StatusBadgeProps) {
  const activeKey = variant || status || "neutral"
  const normalizedKey = String(activeKey).toLowerCase().replace(/\s+/g, "_")
  const config = statusMap[normalizedKey] || {
    label: label || String(activeKey),
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
  }

  const content = children ?? label ?? config.label

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium tracking-normal transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        config.badgeClass,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "shrink-0 rounded-full",
            size === "sm" ? "h-1.5 w-1.5" : "h-1.5 w-1.5",
            config.dotClass
          )}
          aria-hidden="true"
        />
      )}
      <span>{content}</span>
    </span>
  )
}

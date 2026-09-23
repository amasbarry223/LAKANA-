"use client"

import * as React from "react"
import { LucideIcon, Inbox, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: LucideIcon
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  variant?: "default" | "compact" | "card"
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  variant = "default",
  className,
  ...props
}: EmptyStateProps) {
  const isCompact = variant === "compact"
  const isCard = variant === "card"

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact ? "py-8 px-4" : "py-14 px-6",
        isCard && "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60",
          isCompact ? "h-10 w-10 mb-3" : "h-14 w-14 mb-4 shadow-2xs"
        )}
      >
        <Icon className={cn(isCompact ? "h-5 w-5" : "h-7 w-7 text-indigo-600 dark:text-indigo-400")} />
      </div>

      <h3
        className={cn(
          "font-semibold text-slate-900 dark:text-slate-100 tracking-tight",
          isCompact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed",
            isCompact ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}

      {(onAction || onSecondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              )}
            >
              {ActionIcon ? <ActionIcon className="h-3.5 w-3.5" /> : null}
              <span>{actionLabel}</span>
            </button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import React, { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ExpandableCardProps {
  primary: React.ReactNode
  secondary: React.ReactNode
  actions?: React.ReactNode
  defaultOpen?: boolean
  className?: string
  toggleLabel?: string
}

export function ExpandableCard({
  primary,
  secondary,
  actions,
  defaultOpen = false,
  className,
  toggleLabel,
}: ExpandableCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-slate-200/90 bg-white transition-all duration-200 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/90",
        open && "ring-1 ring-indigo-500/20 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div className="min-w-0 flex-1">{primary}</div>
        <div className="ml-3 flex shrink-0 items-center gap-2">
          {actions && <div className="hidden sm:flex items-center gap-1.5">{actions}</div>}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Réduire les détails" : "Afficher plus de détails"}
            className="flex h-8 items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {toggleLabel && <span className="hidden sm:inline">{open ? "Moins" : toggleLabel}</span>}
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5 dark:border-slate-800/80 dark:bg-slate-900/40 animate-in fade-in-50 duration-200">
          <div className="text-sm">{secondary}</div>
          {actions && (
            <div className="mt-4 flex sm:hidden items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              {actions}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

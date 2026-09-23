"use client"

import React from "react"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface ActionItem {
  label: string
  icon?: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
  disabled?: boolean
}

export interface RowActionDropdownProps {
  primaryAction?: {
    label: string
    icon?: React.ReactNode
    onClick: (e: React.MouseEvent) => void
    variant?: "primary" | "secondary" | "outline"
  }
  actions: ActionItem[]
  align?: "end" | "start" | "center"
  className?: string
}

export function RowActionDropdown({
  primaryAction,
  actions,
  align = "end",
  className,
}: RowActionDropdownProps) {
  return (
    <div
      className={cn("flex items-center justify-end gap-1.5", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs transition active:scale-95",
            primaryAction.variant === "primary"
              ? "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          )}
        >
          {primaryAction.icon}
          <span>{primaryAction.label}</span>
        </button>
      )}

      {actions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label="Actions supplémentaires"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align} className="w-48 text-xs">
            {actions.map((act, idx) => (
              <React.Fragment key={idx}>
                {act.danger && idx > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={act.onClick}
                  disabled={act.disabled}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer py-1.5 text-xs font-medium",
                    act.danger && "text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:text-rose-400 dark:focus:bg-rose-950/40"
                  )}
                >
                  {act.icon && <span className="shrink-0">{act.icon}</span>}
                  <span>{act.label}</span>
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

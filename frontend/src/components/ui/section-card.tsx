"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SectionCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  className?: string
}

/**
 * Carte de section standard de l'app (look figé : rounded-xl border bg-white p-5,
 * hors du système de tokens shadcn pour rester compatible avec le mode sombre
 * existant — voir globals.css). Repliable pour la révélation progressive :
 * config avancée, règles, texte explicatif — masqués par défaut.
 */
export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  collapsible = false,
  defaultOpen = true,
  className,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const showBody = !collapsible || open

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => collapsible && setOpen((o) => !o)}
          disabled={!collapsible}
          aria-expanded={collapsible ? open : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 text-left",
            collapsible && "cursor-pointer"
          )}
        >
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {collapsible && (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                open && "rotate-180"
              )}
            />
          )}
        </button>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {showBody && <div className={cn(title || subtitle ? "mt-4" : undefined)}>{children}</div>}
    </div>
  )
}

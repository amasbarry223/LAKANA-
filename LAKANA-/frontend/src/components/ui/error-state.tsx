"use client"

import * as React from "react"
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message?: string
  error?: Error | string | null
  onRetry?: () => void
  isRetrying?: boolean
  retryLabel?: string
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  variant?: "default" | "compact" | "card"
}

export function ErrorState({
  title = "Une erreur est survenue",
  message = "Impossible de récupérer les données depuis le serveur. Veuillez vérifier votre connexion ou réessayer.",
  error,
  onRetry,
  isRetrying = false,
  retryLabel = "Réessayer",
  secondaryActionLabel,
  onSecondaryAction,
  variant = "default",
  className,
  ...props
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const isCompact = variant === "compact"
  const isCard = variant === "card"

  const errorString = error instanceof Error ? error.message : typeof error === "string" ? error : null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact ? "py-6 px-4" : "py-12 px-6",
        isCard && "rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200 dark:border-rose-800",
          isCompact ? "h-10 w-10 mb-3" : "h-13 w-13 mb-4 shadow-2xs"
        )}
      >
        <AlertCircle className={cn(isCompact ? "h-5 w-5" : "h-6 w-6")} />
      </div>

      <h3
        className={cn(
          "font-bold text-slate-900 dark:text-slate-100 tracking-tight",
          isCompact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed",
          isCompact ? "text-xs" : "text-sm"
        )}
      >
        {message}
      </p>

      {/* Détails techniques escamotables */}
      {errorString && (
        <div className="mt-3 max-w-md w-full text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 mx-auto text-2xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            <span>{showDetails ? "Masquer les détails techniques" : "Afficher les détails techniques"}</span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showDetails && (
            <div className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-200 text-2xs font-mono overflow-x-auto shadow-inner border border-slate-800">
              <code>{errorString}</code>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {(onRetry || onSecondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 active:scale-98 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")} />
              <span>{isRetrying ? "Nouvelle tentative..." : retryLabel}</span>
            </button>
          )}

          {onSecondaryAction && secondaryActionLabel && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
            >
              <span>{secondaryActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

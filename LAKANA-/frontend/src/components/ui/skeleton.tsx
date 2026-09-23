import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-slate-200/80 dark:bg-slate-800 animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

/**
 * Squelette réaliste pour les lignes de tableau afin d'éliminer les sauts de page.
 */
function TableSkeleton({
  rows = 5,
  cols = 5,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn("w-full divide-y divide-slate-100 dark:divide-slate-800", className)} aria-busy="true" aria-label="Chargement des données...">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 px-5 py-4 animate-pulse">
          {/* Avatar / Icône */}
          <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-800" />
          
          {/* Colonne principale (Nom + sous-titre) */}
          <div className="min-w-0 flex-1 space-y-2">
            <div
              className="h-3.5 rounded bg-slate-200 dark:bg-slate-800"
              style={{ width: `${55 + (rIdx % 4) * 10}%` }}
            />
            <div className="h-2.5 w-1/3 rounded bg-slate-100 dark:bg-slate-850" />
          </div>

          {/* Colonnes secondaires modulaires */}
          {cols >= 3 && (
            <div className="hidden sm:block w-28">
              <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          )}

          {cols >= 4 && (
            <div className="hidden md:block w-24 space-y-1.5 text-right">
              <div className="ml-auto h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="ml-auto h-2.5 w-10 rounded bg-slate-100 dark:bg-slate-850" />
            </div>
          )}

          {cols >= 5 && (
            <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800" />
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Squelette pour les grilles de cartes (mode Grid dans Centre d'alertes).
 */
function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3", className)}
      aria-busy="true"
      aria-label="Chargement de la grille..."
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs animate-pulse space-y-4"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-1.5">
              <div className="h-2.5 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-2.5 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-7 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Squelette pour le volet de détail (panneau latéral d'investigation ou KYC).
 */
function DetailPaneSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 rounded-xl border border-slate-200 bg-white p-5 animate-pulse", className)}>
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 rounded bg-slate-200" />
        <div className="h-5 w-16 rounded-full bg-slate-200" />
      </div>
      <div className="space-y-2.5 pt-2">
        <div className="h-14 rounded-lg bg-slate-100 p-3" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 rounded-lg bg-slate-100" />
          <div className="h-12 rounded-lg bg-slate-100" />
          <div className="h-12 rounded-lg bg-slate-100" />
          <div className="h-12 rounded-lg bg-slate-100" />
        </div>
        <div className="h-20 rounded-lg bg-slate-100" />
      </div>
    </div>
  )
}

/**
 * Squelette pour les cartes KPI de haut de page.
 */
function StatCardsSkeleton({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs animate-pulse space-y-2"
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-7 w-16 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton, TableSkeleton, CardGridSkeleton, DetailPaneSkeleton, StatCardsSkeleton }

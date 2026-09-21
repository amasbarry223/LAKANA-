"use client"

import { useRef, useState } from "react"
import { ChevronDown, List, LayoutGrid, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { useDashboard, DEFAULT_FILTERS } from "@/lib/dashboard-context"

const filterOptions: Record<string, string[]> = {
  "Tous statuts": ["Tous statuts", "En cours", "Clôturée", "Transmise"],
  "Tous niveaux": ["Tous niveaux", "Bloquante", "À analyser", "Informative"],
  "Tous modules": ["Tous modules", "Filtrage sanctions", "Risk Score", "Fractionnement", "Comportementale"],
  "Tous analystes": ["Tous analystes", "A. Touré", "M. Diallo", "F. Koné"],
}

const filterKeys: Record<string, keyof typeof DEFAULT_FILTERS> = {
  "Tous statuts": "status",
  "Tous niveaux": "level",
  "Tous modules": "module",
  "Tous analystes": "analyste",
}

export function FilterBar() {
  const {
    filters,
    setFilters,
    compareMode,
    setCompareMode,
    alertsView,
    setAlertsView,
  } = useDashboard()
  const containerRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const handleFullscreen = () => {
    const el = containerRef.current?.closest("[data-alerts-widgets]") as HTMLElement | null
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      return
    }
    el.requestFullscreen?.().catch(() => {
      el.classList.add("fixed", "inset-4", "z-50", "overflow-auto", "bg-slate-50", "p-4", "rounded-xl", "shadow-2xl")
    })
  }

  return (
    <div ref={containerRef} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {Object.keys(filterOptions).map((d) => (
          <div key={d} className="relative">
            <button
              onClick={() => setMenuOpen(menuOpen === d ? null : d)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {filters[filterKeys[d]]}
              <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition", menuOpen === d && "rotate-180")} />
            </button>
            {menuOpen === d && (
              <div className="absolute left-0 top-11 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {filterOptions[d].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFilters({ ...filters, [filterKeys[d]]: opt })
                      setMenuOpen(null)
                    }}
                    className={cn(
                      "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-slate-50",
                      filters[filterKeys[d]] === opt ? "font-semibold text-indigo-600" : "text-slate-600"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {(filters.status !== DEFAULT_FILTERS.status ||
          filters.level !== DEFAULT_FILTERS.level ||
          filters.module !== DEFAULT_FILTERS.module ||
          filters.analyste !== DEFAULT_FILTERS.analyste) && (
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-xs font-medium text-slate-500 hover:text-indigo-600"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm font-medium text-slate-600">Comparer</span>
          <Switch checked={compareMode} onCheckedChange={setCompareMode} />
        </label>

        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => setAlertsView("list")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition",
              alertsView === "list"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
            aria-label="Vue liste"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAlertsView("grid")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition",
              alertsView === "grid"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
            aria-label="Vue grille"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={handleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600"
            aria-label="Plein écran"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { ChevronDown, List, LayoutGrid, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

const dropdowns = ["Tous statuts", "Tous niveaux", "Tous modules", "Tous analystes"]

export function FilterBar() {
  const [compare, setCompare] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {dropdowns.map((d) => (
          <button
            key={d}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {d}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm font-medium text-slate-600">Comparer</span>
          <Switch checked={compare} onCheckedChange={setCompare} />
        </label>

        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition",
              view === "list"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
            aria-label="Vue liste"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition",
              view === "grid"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            )}
            aria-label="Vue grille"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
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

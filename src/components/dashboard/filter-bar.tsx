"use client"

import { useState } from "react"
import { ChevronDown, List, LayoutGrid, Maximize2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

const filterOptions: Record<string, string[]> = {
  "Tous statuts": ["Tous statuts", "En cours", "Clôturée", "Transmise"],
  "Tous niveaux": ["Tous niveaux", "Bloquante", "À analyser", "Informative"],
  "Tous modules": ["Tous modules", "Filtrage sanctions", "Risk Score", "Fractionnement", "Comportementale"],
  "Tous analystes": ["Tous analystes", "A. Touré", "M. Diallo", "F. Koné"],
}

export function FilterBar() {
  const [compare, setCompare] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, string>>(
    Object.fromEntries(Object.keys(filterOptions).map((k) => [k, k]))
  )

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {Object.keys(filterOptions).map((d) => (
          <div key={d} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === d ? null : d)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {selected[d]}
              <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition", openMenu === d && "rotate-180")} />
            </button>
            {openMenu === d && (
              <div className="absolute left-0 top-11 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {filterOptions[d].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelected((s) => ({ ...s, [d]: opt }))
                      setOpenMenu(null)
                      if (opt !== d) toast.success("Filtre appliqué", { description: `${d.replace("Tous ", "")} : ${opt}` })
                    }}
                    className={cn(
                      "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-slate-50",
                      selected[d] === opt ? "font-semibold text-indigo-600" : "text-slate-600"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm font-medium text-slate-600">Comparer</span>
          <Switch
            checked={compare}
            onCheckedChange={(v) => {
              setCompare(v)
              toast.info(v ? "Mode comparaison activé" : "Mode comparaison désactivé")
            }}
          />
        </label>

        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => {
              setView("list")
              toast.info("Vue liste")
            }}
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
            onClick={() => {
              setView("grid")
              toast.info("Vue grille")
            }}
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
            onClick={() => toast.info("Plein écran", { description: "Le widget passe en plein écran." })}
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

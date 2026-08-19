"use client"

import { Search, Calendar, Plus, Bell, ChevronDown, Wifi, CloudOff } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function DashboardHeader() {
  const [online, setOnline] = useState(true)

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md md:px-6 lg:left-[260px]">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un client, une alerte..."
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-12 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Sync / offline indicator (OFF-03) */}
        <button
          onClick={() => setOnline(!online)}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition",
            online
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          )}
          title={online ? "En ligne — données à jour" : "Mode hors ligne — synchronisation en attente"}
        >
          {online ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <CloudOff className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">
            {online ? "Synchronisé" : "Hors ligne"}
          </span>
        </button>

        {/* Notifications */}
        <button className="relative hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 sm:flex">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>

        {/* Date Range */}
        <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="hidden sm:inline">19 - 25 août 2026</span>
          <span className="sm:hidden">Août</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {/* New investigation */}
        <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle investigation</span>
          <span className="sm:hidden">Nouvelle</span>
        </button>
      </div>
    </header>
  )
}

"use client"

import { Search, Calendar, Plus, Bell, ChevronDown, Wifi, CloudOff, Menu } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function DashboardHeader({ onMenuClick, onOpenSearch }: { onMenuClick?: () => void; onOpenSearch?: () => void }) {
  const [online, setOnline] = useState(true)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showDates, setShowDates] = useState(false)

  const notifList = [
    { title: "Alerte bloquante non traitée", desc: "ALR-241 (Traoré M.) — score 87/100", time: "Il y a 12 min", color: "text-rose-600" },
    { title: "Correspondance PPE confirmée", desc: "FLT-225 (Touré A.) — similarité 99%", time: "Il y a 1h", color: "text-amber-600" },
    { title: "Investigation > 24h", desc: "INV-238 (Diarra F.) en cours depuis 26h", time: "Il y a 2h", color: "text-amber-600" },
  ]

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md md:px-6 lg:left-[260px]">
      {/* Mobile menu button */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Search */}
      <button
        onClick={onOpenSearch}
        className="relative flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition hover:bg-white hover:border-slate-300"
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="flex-1 text-left">Rechercher un client, une alerte...</span>
        <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Sync / offline indicator (OFF-03) */}
        <button
          onClick={() => {
            setOnline(!online)
            toast.success(online ? "Mode hors ligne activé" : "Connexion rétablie", {
              description: online ? "Base locale chiffrée active (OFF-01)." : "Données resynchronisées.",
            })
          }}
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
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 sm:flex"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-xs font-semibold text-slate-700">Notifications récentes</p>
                <button
                  onClick={() => setShowNotifs(false)}
                  className="text-[11px] font-medium text-indigo-600 hover:underline"
                >
                  Voir tout
                </button>
              </div>
              <div className="space-y-1">
                {notifList.map((n, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      toast.info("Notification ouverte", { description: n.desc })
                      setShowNotifs(false)
                    }}
                    className="block w-full rounded-lg p-2 text-left transition hover:bg-slate-50"
                  >
                    <p className={cn("text-xs font-semibold", n.color)}>{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{n.desc}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{n.time}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="relative">
          <button
            onClick={() => setShowDates(!showDates)}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="hidden sm:inline">19 - 25 août 2026</span>
            <span className="sm:hidden">Août</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
          {showDates && (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Période</p>
              {["Aujourd'hui", "7 derniers jours", "30 derniers jours", "Ce trimestre", "Personnalisé"].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    toast.success("Période mise à jour", { description: p })
                    setShowDates(false)
                  }}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New investigation */}
        <button
          onClick={() => toast.success("Nouvelle investigation créée", { description: "Dossier INV-246 ouvert — en attente de documentation." })}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle investigation</span>
          <span className="sm:hidden">Nouvelle</span>
        </button>
      </div>
    </header>
  )
}

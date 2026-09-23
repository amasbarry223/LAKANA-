"use client"

import { Search, Calendar, Bell, ChevronDown, Menu, Sun, Moon, HelpCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/dashboard-context"
import { AlertDetailModal } from "@/components/dashboard/alert-detail-modal"
import { HelpModal } from "@/components/dashboard/help-modal"
import { alertService } from "@/services/alertService"
import type { AlertItem } from "@/lib/dashboard-context"
import type { Alert } from "@/models/alert"

const DATE_PRESETS = ["Aujourd'hui", "7 derniers jours", "30 derniers jours", "Ce trimestre", "Personnalisé"] as const

type LiveNotification = {
  id: string
  ref: string
  title: string
  desc: string
  time: string
  color: string
  level: Alert["level"]
  client: string
  score: number
  rawAlert: Alert
}

export function DashboardHeader({
  onMenuClick,
  onOpenSearch,
  onNavigate,
  onNewInvestigation,
}: {
  onMenuClick?: () => void
  onOpenSearch?: () => void
  onNavigate: (view: string, options?: { clientId?: string; alertRef?: string }) => void
  onNewInvestigation?: () => void
}) {
  const { dateRange, setDateRange, dateRangeLabel, sidebarCollapsed } = useDashboard()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showDates, setShowDates] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [dailyProgress, setDailyProgress] = useState<{ processed: number; total: number } | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null)
  const [notifications, setNotifications] = useState<LiveNotification[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Raccourci clavier conventionnel : '?' ouvre le centre d'aide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === "input" || tag === "textarea" || tag === "select") return
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault()
        setShowHelp(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const fetchLiveNotifs = () => {
    alertService
      .getAlerts()
      .then((alerts) => {
        const total = alerts.length
        const processed = alerts.filter(
          (a) => a.status === "cloturee" || a.status === "classee" || a.status === "en_cours"
        ).length
        if (total > 0) {
          setDailyProgress({ processed, total })
        }

        const unhandled = alerts.filter((a) => a.status === "nouvelle" || a.level === "bloquante").slice(0, 6)
        const mapped: LiveNotification[] = unhandled.map((a) => {
          const isBloquante = a.level === "bloquante"
          return {
            id: a.id,
            ref: a.ref,
            title: isBloquante ? "Alerte bloquante non traitée" : "Alerte à qualifier",
            desc: `${a.ref} (${a.client}) — score ${a.score}/100`,
            time: a.createdAt ? new Date(a.createdAt).toLocaleDateString("fr-FR") : "Récent",
            color: isBloquante ? "text-rose-600" : "text-amber-600",
            level: a.level,
            client: a.client,
            score: a.score,
            rawAlert: a,
          }
        })
        setNotifications(mapped)
      })
      .catch(() => { })
  }

  useEffect(() => {
    fetchLiveNotifs()
    window.addEventListener("lakana-alert-updated", fetchLiveNotifs)
    return () => window.removeEventListener("lakana-alert-updated", fetchLiveNotifs)
  }, [])

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md md:px-6 transition-[left] duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950/80",
          sidebarCollapsed ? "lg:left-[76px]" : "lg:left-[260px]"
        )}
      >
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <button
          onClick={onOpenSearch}
          className="relative flex h-9 w-64 sm:w-80 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs text-slate-400 transition hover:bg-white hover:border-slate-300 cursor-pointer dark:border-slate-800 dark:bg-slate-900/80"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="flex-1 text-left truncate">Rechercher un client, une alerte...</span>
          <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block dark:border-slate-700 dark:bg-slate-800">
            ⌘K
          </kbd>
        </button>

        {/* Système opérationnel status pill */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Système opérationnel</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          {/* Mode Sombre / Clair (Moon icon) */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            title={mounted && theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            aria-label="Basculer le mode sombre"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-500 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200 hover:-rotate-12 dark:text-slate-300" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#CD0D29] text-[10px] font-bold text-white px-1 shadow-xs">
                3
              </span>
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Alertes non traitées ({notifications.length})
                  </p>
                  <button
                    onClick={() => {
                      setShowNotifs(false)
                      onNavigate("Centre d'alertes")
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">Aucune alerte en attente.</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setSelectedAlert({
                            id: n.rawAlert.id,
                            ref: n.rawAlert.ref,
                            client: n.rawAlert.client,
                            clientId: n.rawAlert.clientId,
                            score: n.rawAlert.score,
                            type: n.rawAlert.type,
                            level: n.rawAlert.level,
                            module: n.rawAlert.module,
                            analyste: n.rawAlert.analyste || "A. Touré",
                            facteurs: n.rawAlert.facteurs,
                            status: n.rawAlert.status,
                            createdAt: n.rawAlert.createdAt,
                          })
                          setShowNotifs(false)
                        }}
                        className="block w-full rounded-lg p-2 text-left transition hover:bg-slate-50 cursor-pointer"
                      >
                        <p className={cn("text-xs font-semibold", n.color)}>{n.title}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{n.desc}</p>
                        <p className="mt-0.5 text-2xs text-slate-400">{n.time}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowDates(!showDates)}
              className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>{dateRange === "Ce trimestre" || !dateRange ? "14 - 21 août 2026" : dateRangeLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {showDates && (
              <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Période</p>
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setDateRange(p)
                      setShowDates(false)
                    }}
                    className={cn(
                      "block w-full rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-slate-50 cursor-pointer",
                      dateRange === p ? "font-semibold text-indigo-600" : "text-slate-600"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {selectedAlert && (
        <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}

      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  )
}

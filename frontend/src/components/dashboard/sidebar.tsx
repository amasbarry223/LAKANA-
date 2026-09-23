"use client"

import {
  LayoutGrid,
  BellRing,
  UserPlus,
  UserRound,
  Share2,
  FolderSearch,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Users,
  ScrollText,
  FileBarChart,
  Database,
  Settings,
  MoreVertical,
  LogOut,
  X,
  Bell,
  Wifi,
  CloudOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/dashboard-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { alertService } from "@/services/alertService"
import { toast } from "sonner"

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  badgeType?: "alerts" | "ai" | "custom"
  customBadge?: string
}

type NavSection = {
  id: string
  title: string
  items: NavItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

const standardSections: NavSection[] = [
  {
    id: "dashboard",
    title: "PILOTAGE",
    items: [{ label: "Tableau de bord", icon: LayoutGrid }],
  },
  {
    id: "surveillance",
    title: "SURVEILLANCE OPÉRATIONNELLE",
    items: [
      { label: "Centre d'alertes", icon: BellRing, badgeType: "alerts" },
      { label: "Contrôle & Pré-filtrage Sociétaire", icon: ShieldCheck },
      { label: "Filtrage sanctions/PPE", icon: ShieldAlert },
    ],
  },
  {
    id: "clients",
    title: "DOSSIERS & CLIENTS",
    items: [
      { label: "Investigations", icon: FolderSearch },
      { label: "Clients & Enrôlement", icon: UserPlus },
      { label: "Client 360°", icon: UserRound },
      { label: "Graphe de relations", icon: Share2 },
      { label: "Consultation Réglementaire", icon: MessageSquare },
    ],
  },
  {
    id: "governance",
    title: "GOUVERNANCE & SYSTÈME",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Rapports réglementaires", icon: FileBarChart },
      { label: "Journal d'audit", icon: ScrollText },
      { label: "Intégration & Synchronisation", icon: Database },
      { label: "Utilisateurs & rôles", icon: Users },
      { label: "Paramètres", icon: Settings },
    ],
  },
]

const guichetSections: NavSection[] = [
  {
    id: "dashboard",
    title: "PILOTAGE GUICHET",
    items: [{ label: "Tableau de bord", icon: LayoutGrid }],
  },
  {
    id: "surveillance",
    title: "SÉCURITÉ & CONFORMITÉ GUICHET",
    items: [
      { label: "Contrôle & Pré-filtrage Sociétaire", icon: ShieldCheck },
      { label: "Filtrage sanctions/PPE", icon: ShieldAlert },
    ],
  },
  {
    id: "communication",
    title: "COMMUNICATION & ALERTES",
    items: [{ label: "Notifications", icon: Bell }],
  },
]

export type SidebarProps = {
  active: string
  onSelect: (label: string) => void
  userName?: string
  userRole?: string
  onLogout?: () => void
}

function SidebarContent({
  active,
  onSelect,
  userName = "Aminata Touré",
  userRole = "Analyste conformité",
  onLogout,
}: SidebarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const [menuOpen, setMenuOpen] = useState(false)
  const { online, setOnline } = useDashboard()
  const [activeAlertsCount, setActiveAlertsCount] = useState<number | null>(null)

  const isGuichet = userRole.toLowerCase().includes("guichet")
  const sectionsToRender = isGuichet ? guichetSections : standardSections

  // Section repliable de gouvernance
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    governance: false,
  })

  // Chargement des alertes actives pour le badge dynamique
  const loadAlertBadge = useCallback(async () => {
    try {
      const counts = await alertService.getAlertCounts()
      const urgentCount = (counts.bloquante || 0) + (counts.analyser || 0)
      setActiveAlertsCount(urgentCount > 0 ? urgentCount : null)
    } catch {
      setActiveAlertsCount(null)
    }
  }, [])

  useEffect(() => {
    loadAlertBadge()
    window.addEventListener("lakana-alert-updated", loadAlertBadge)
    return () => window.removeEventListener("lakana-alert-updated", loadAlertBadge)
  }, [loadAlertBadge])

  // Dépliage automatique si un item de la section gouvernance est actif
  useEffect(() => {
    const govSection = sectionsToRender.find((s) => s.id === "governance")
    if (govSection && govSection.items.some((i) => i.label === active)) {
      setExpandedSections((prev) => ({ ...prev, governance: true }))
    }
  }, [active, sectionsToRender])

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleNetwork = () => {
    const next = !online
    setOnline(next)
    toast.info(next ? "Connexion rétablie" : "Mode hors-ligne activé", {
      description: next
        ? "Synchronisation active avec le Core Banking SFD."
        : "Les opérations locales seront mises en file d'attente.",
    })
  }

  return (
    <div className="flex h-full flex-col bg-white text-slate-800 select-none">
      {/* 1. Brand & Institution Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <div className="flex items-center gap-3">
          {/* Logo Badge */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 shadow-md shadow-indigo-500/20 ring-1 ring-black/5 transition-transform hover:scale-105">
            <ShieldAlert className="h-5 w-5 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                LAKANA
              </span>
              <span className="rounded-md border border-indigo-200/70 bg-indigo-50/80 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 tracking-wider">
                AML • UEMOA
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Surveillance SFD Mali
            </span>
          </div>
        </div>
      </div>

      {/* 2. Live SFD Connectivity Chip */}
      <div className="px-3 pt-3">
        <button
          onClick={toggleNetwork}
          className={cn(
            "group flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-all duration-150 cursor-pointer",
            online
              ? "border-emerald-200/80 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300"
              : "border-amber-200/80 bg-amber-50/50 text-amber-800 hover:bg-amber-50 hover:border-amber-300"
          )}
          title="Cliquer pour basculer l'état de synchronisation"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                  online ? "bg-emerald-400" : "bg-amber-400"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  online ? "bg-emerald-500" : "bg-amber-500"
                )}
              />
            </span>
            <span className="text-[11px] font-semibold">
              {online ? "SFD Bamako • En direct" : "SFD Bamako • Hors ligne"}
            </span>
          </div>
          <span className="text-[10px] font-medium opacity-60 group-hover:opacity-100 transition-opacity">
            {online ? "Sync OK" : "Différé"}
          </span>
        </button>
      </div>

      {/* 3. Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 sidebar-scroll">
        {sectionsToRender.map((section) => {
          const isCollapsible = section.collapsible
          const isOpen = !isCollapsible || !!expandedSections[section.id]

          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header */}
              {section.title && (
                <div
                  onClick={() => isCollapsible && toggleSection(section.id)}
                  className={cn(
                    "flex items-center justify-between px-2.5 pb-1 pt-1 text-[10px] font-bold tracking-wider text-slate-400 select-none uppercase",
                    isCollapsible &&
                      "cursor-pointer rounded-md transition-colors hover:text-slate-700"
                  )}
                >
                  <span>{section.title}</span>
                  {isCollapsible && (
                    <div className="flex items-center gap-1 text-[10px] font-normal lowercase tracking-normal text-slate-400">
                      <span>{isOpen ? "masquer" : `${section.items.length}`}</span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          isOpen && "rotate-180"
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              {isOpen && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = active === item.label
                    const Icon = item.icon

                    return (
                      <button
                        key={item.label}
                        onClick={() => onSelect(item.label)}
                        className={cn(
                          "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer overflow-hidden",
                          isActive
                            ? "bg-indigo-50/90 text-indigo-700 font-semibold shadow-xs border border-indigo-100/80 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-indigo-600"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-150",
                            isActive
                              ? "text-indigo-600 scale-105"
                              : "text-slate-400 group-hover:text-indigo-600 group-hover:scale-110"
                          )}
                        />

                        <span className="truncate flex-1 text-left">{item.label}</span>

                        {/* Badges interactifs */}
                        {item.badgeType === "alerts" && activeAlertsCount !== null && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
                            {activeAlertsCount}
                          </span>
                        )}

                        {/* Chevron subtil sur item actif */}
                        {isActive && item.badgeType !== "alerts" && (
                          <ChevronRight className="h-3.5 w-3.5 text-indigo-400 animate-in fade-in" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* 4. Modern User Profile Card & Quick Actions Popover */}
      <div className="relative border-t border-slate-100 p-3 bg-gradient-to-b from-white to-slate-50/60">
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 transition-all duration-150 cursor-pointer border",
            menuOpen
              ? "bg-slate-100 border-slate-200 shadow-xs"
              : "border-transparent hover:bg-slate-100/80 hover:border-slate-200/60"
          )}
        >
          {/* Avatar with Status Indicator */}
          <div className="relative">
            <Avatar className="h-9 w-9 border border-indigo-100 shadow-xs">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-xs font-bold tracking-tight">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                online ? "bg-emerald-500" : "bg-amber-500"
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900 leading-tight">
              {userName}
            </p>
            <p className="truncate text-[10px] font-medium text-slate-400 mt-0.5">
              {userRole}
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Menu utilisateur"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Popover Menu */}
        {menuOpen && (
          <div className="absolute bottom-16 left-3 right-3 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-2.5 py-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Compte actif
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <ShieldCheck className="h-3 w-3" />
                  Certifié LAKANA
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 mt-1">{userName}</p>
              <p className="text-[10px] text-slate-500">{userRole}</p>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  onSelect("Paramètres")
                  setMenuOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                Paramètres & Rôles
              </button>

              <button
                onClick={() => {
                  toggleNetwork()
                  setMenuOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {online ? (
                    <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <CloudOff className="h-3.5 w-3.5 text-amber-600" />
                  )}
                  {online ? "Mode En direct (Sync)" : "Mode Hors-ligne"}
                </span>
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    online ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </button>
            </div>

            <div className="my-1 h-px bg-slate-100" />

            <button
              onClick={() => {
                setMenuOpen(false)
                onLogout?.()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function DashboardSidebar(props: SidebarProps) {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[260px] shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-[1px_0_12px_rgba(0,0,0,0.02)]">
      <SidebarContent {...props} />
    </aside>
  )
}

export function MobileSidebar({
  open,
  onClose,
  ...props
}: SidebarProps & { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-slate-200 bg-white shadow-2xl animate-in slide-in-from-left duration-200">
        <button
          onClick={onClose}
          className="absolute right-3 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="Fermer le menu"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent
          {...props}
          onSelect={(label) => {
            props.onSelect(label)
            onClose()
          }}
        />
      </aside>
    </div>
  )
}

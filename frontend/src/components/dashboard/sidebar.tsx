"use client"

import {
  LayoutGrid,
  BellRing,
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
  ChevronLeft,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/dashboard-context"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
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
    id: "main",
    title: "",
    items: [
      { label: "Tableau de bord", icon: LayoutGrid },
    ],
  },
  {
    id: "surveillance",
    title: "SURVEILLANCE & OPÉRATIONS",
    items: [
      { label: "Alertes & Détections", icon: BellRing, badgeType: "alerts" },
      { label: "Dossiers d'investigation", icon: FolderSearch },
      { label: "Contrôle d'opération", icon: ShieldCheck },
      { label: "Vérification Sanctions & PPE", icon: ShieldAlert },
    ],
  },
  {
    id: "clients",
    title: "ANALYSE APPROFONDIE",
    items: [
      { label: "Fiches Sociétaires", icon: UserRound },
      { label: "Cartographie des flux", icon: Share2 },
      { label: "Assistant IA", icon: MessageSquare },
    ],
  },
  {
    id: "governance",
    title: "GOUVERNANCE & ADMINISTRATION",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Gestion des utilisateurs", icon: Users },
      { label: "Rapports CENTIF & États", icon: FileBarChart },
      { label: "Piste d'audit", icon: ScrollText },
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
    title: "CONTRÔLE & VÉRIFICATIONS",
    items: [
      { label: "Contrôle d'opération", icon: ShieldCheck },
      { label: "Vérification Sanctions & PPE", icon: ShieldAlert },
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
  /** Rail mode : icônes seules avec tooltips. N'a de sens que sur le sidebar fixe desktop. */
  collapsed?: boolean
}

function SidebarContent({
  active,
  onSelect,
  userName = "Aminata Touré",
  userRole = "Analyste conformité",
  onLogout,
  collapsed = false,
}: SidebarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const { online, setOnline } = useDashboard()
  const [activeAlertsCount, setActiveAlertsCount] = useState<number | null>(null)

  // Keyboard navigation: Escape key closes logout confirmation
  useEffect(() => {
    if (!confirmLogoutOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmLogoutOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [confirmLogoutOpen])

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
    <div className="flex h-full flex-col bg-[#070347] text-white select-none">
      {/* 1. Brand & Institution Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/10",
          collapsed ? "justify-center px-2" : "justify-between px-5"
        )}
      >
        <div
          onClick={() => onSelect("Tableau de bord")}
          className="flex min-w-0 items-center gap-3 cursor-pointer group"
          title="Tableau de bord LAKANA"
        >
          {/* Logo Badge */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md transition-transform duration-150 group-hover:scale-105">
            <img
              src="/logo.png"
              alt="LAKANA Logo"
              className="h-full w-full object-contain rounded-lg"
            />
          </div>

          {!collapsed && (
            <span className="text-xl font-black tracking-wider text-white whitespace-nowrap">
              LAKANA
            </span>
          )}
        </div>
      </div>

      {/* 2. Navigation List */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4 sidebar-scroll">
        {sectionsToRender.map((section) => {
          const isCollapsible = section.collapsible
          const isOpen = collapsed || !isCollapsible || !!expandedSections[section.id]

          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header */}
              {section.title && !collapsed && (
                <button
                  type="button"
                  onClick={() => isCollapsible && toggleSection(section.id)}
                  aria-expanded={isCollapsible ? isOpen : undefined}
                  className={cn(
                    "flex w-full items-center justify-between px-3 pb-1 pt-2 text-[10px] font-bold tracking-wider text-[#98A3B9]/80 select-none uppercase",
                    isCollapsible &&
                    "cursor-pointer rounded-md transition-colors hover:text-white"
                  )}
                >
                  <span>{section.title}</span>
                  {isCollapsible && (
                    <span className="flex items-center gap-1 text-[10px] font-normal lowercase tracking-normal text-[#98A3B9]">
                      <span>{isOpen ? "masquer" : `${section.items.length}`}</span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          isOpen && "rotate-180"
                        )}
                      />
                    </span>
                  )}
                </button>
              )}
              {section.title && collapsed && (
                <div className="mx-2 my-2 h-px bg-white/10" aria-hidden />
              )}

              {/* Items */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={collapsed ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="space-y-1 overflow-hidden"
                  >
                    {section.items.map((item) => {
                      const isActive = active === item.label
                      const Icon = item.icon
                      const badgeCount =
                        item.badgeType === "alerts"
                          ? activeAlertsCount !== null && activeAlertsCount > 0
                            ? activeAlertsCount
                            : 3
                          : null

                      const button = (
                        <button
                          key={item.label}
                          onClick={() => onSelect(item.label)}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "group relative flex w-full items-center gap-3 rounded-xl py-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer active:scale-[0.98]",
                            collapsed ? "justify-center px-0" : "px-3.5",
                            isActive
                              ? "text-white font-semibold"
                              : "text-[#98A3B9] hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active-pill"
                              transition={{ type: "spring", stiffness: 500, damping: 35 }}
                              className="absolute inset-0 rounded-xl bg-[#181466] shadow-xs"
                            />
                          )}
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active-bar"
                              transition={{ type: "spring", stiffness: 500, damping: 35 }}
                              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#CD0D29]"
                            />
                          )}

                          <span className="relative shrink-0">
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                                isActive ? "text-white" : "text-[#98A3B9] group-hover:text-white"
                              )}
                            />
                            {badgeCount !== null && collapsed && (
                              <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#CD0D29] px-0.5 text-[9px] font-bold text-white ring-2 ring-[#070347]">
                                {badgeCount}
                              </span>
                            )}
                          </span>

                          {!collapsed && (
                            <span className="relative z-10 truncate flex-1 text-left">
                              {item.label}
                            </span>
                          )}

                          {!collapsed && badgeCount !== null && (
                            <span className="relative z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#CD0D29] px-1 text-[10px] font-bold text-white shadow-xs">
                              {badgeCount}
                            </span>
                          )}
                        </button>
                      )

                      if (!collapsed) return button

                      return (
                        <Tooltip key={item.label}>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent side="right" sideOffset={10}>
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* 3. Modern User Profile Card */}
      <div className="relative border-t border-white/10 p-3 bg-[#050236]">
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 transition-all duration-150 cursor-pointer",
            collapsed && "justify-center",
            menuOpen ? "bg-white/10" : "hover:bg-white/5"
          )}
        >
          {/* Avatar with Status Indicator Ring */}
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#070347] text-white text-xs font-bold ring-2 ring-emerald-500 shadow-xs">
              {initials}
            </div>
          </div>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white leading-tight">
                  {userName}
                </p>
                <p className="truncate text-[10px] font-medium text-[#98A3B9] mt-0.5">
                  {userRole === "Analyste conformité" ? "Analyste SFD Mali" : userRole}
                </p>
              </div>

              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors"
                aria-label="Menu utilisateur"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Popover Menu */}
        {menuOpen && (
          <div
            className={cn(
              "absolute bottom-16 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150",
              collapsed ? "left-2 w-64" : "left-3 right-3"
            )}
          >
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
                setConfirmLogoutOpen(true)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        )}
      </div>

      {/* Confirmation de Déconnexion (Aversion à la perte & Réduction d'anxiété) */}
      {confirmLogoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={() => setConfirmLogoutOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-desc"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 id="logout-dialog-title" className="text-base font-bold text-slate-900">
              Confirmer la déconnexion
            </h3>
            <p id="logout-dialog-desc" className="mt-1 text-xs text-slate-500 leading-relaxed">
              Voulez-vous fermer votre session LAKANA ? Vos enquêtes en cours et le journal d'audit réglementaire sont sauvegardés et chiffrés.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmLogoutOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Rester connecté
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmLogoutOpen(false)
                  onLogout?.()
                }}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition cursor-pointer"
              >
                Me déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardSidebar(props: SidebarProps) {
  const { sidebarCollapsed, setSidebarCollapsed } = useDashboard()

  return (
    <aside
      className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 z-40 shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-[1px_0_12px_rgba(0,0,0,0.02)] transition-[width] duration-300 ease-in-out",
        sidebarCollapsed ? "w-[76px]" : "w-[260px]"
      )}
    >
      <SidebarContent {...props} collapsed={sidebarCollapsed} />

      {/* Poignée de repli/dépliage, ancrée sur le bord du sidebar */}
      <button
        type="button"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label={sidebarCollapsed ? "Déployer la barre latérale" : "Réduire la barre latérale"}
        aria-pressed={sidebarCollapsed}
        className="absolute -right-3 top-[68px] z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition-all duration-200 hover:scale-110 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer"
      >
        <ChevronLeft
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-300",
            sidebarCollapsed && "rotate-180"
          )}
        />
      </button>
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
          collapsed={false}
          onSelect={(label) => {
            props.onSelect(label)
            onClose()
          }}
        />
      </aside>
    </div>
  )
}

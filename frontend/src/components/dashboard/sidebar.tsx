"use client"

import {
  Home,
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
    id: "main",
    title: "",
    items: [
      { label: "Accueil", icon: Home },
      { label: "Tableau de bord", icon: LayoutGrid },
    ],
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
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <div
          onClick={() => onSelect("Accueil")}
          className="flex items-center gap-3 cursor-pointer group"
          title="Tableau de bord LAKANA"
        >
          {/* Logo Badge */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md">
            <img
              src="/logo.png"
              alt="LAKANA Logo"
              className="h-full w-full object-contain rounded-lg"
            />
          </div>

          <span className="text-xl font-black tracking-wider text-white">
            LAKANA
          </span>
        </div>
      </div>

      {/* 2. Navigation List */}
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
                    "flex items-center justify-between px-3 pb-1 pt-2 text-[10px] font-bold tracking-wider text-[#98A3B9]/80 select-none uppercase",
                    isCollapsible &&
                    "cursor-pointer rounded-md transition-colors hover:text-white"
                  )}
                >
                  <span>{section.title}</span>
                  {isCollapsible && (
                    <div className="flex items-center gap-1 text-[10px] font-normal lowercase tracking-normal text-[#98A3B9]">
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
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = active === item.label
                    const Icon = item.icon

                    return (
                      <button
                        key={item.label}
                        onClick={() => onSelect(item.label)}
                        className={cn(
                          "group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-150 cursor-pointer",
                          isActive
                            ? "bg-[#181466] text-white font-semibold shadow-xs"
                            : "text-[#98A3B9] hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-150",
                            isActive ? "text-white" : "text-[#98A3B9] group-hover:text-white"
                          )}
                        />

                        <span className="truncate flex-1 text-left">{item.label}</span>

                        {/* Badges interactifs (Rouge #CD0D29) */}
                        {item.badgeType === "alerts" && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#CD0D29] px-1 text-[10px] font-bold text-white shadow-xs">
                            {activeAlertsCount !== null && activeAlertsCount > 0 ? activeAlertsCount : 3}
                          </span>
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

      {/* 3. Modern User Profile Card */}
      <div className="relative border-t border-white/10 p-3 bg-[#050236]">
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 transition-all duration-150 cursor-pointer",
            menuOpen ? "bg-white/10" : "hover:bg-white/5"
          )}
        >
          {/* Avatar with Status Indicator Ring */}
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#070347] text-white text-xs font-bold ring-2 ring-emerald-500 shadow-xs">
              {initials}
            </div>
          </div>

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

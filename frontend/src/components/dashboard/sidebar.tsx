"use client"

import {
  LayoutGrid,
  BellRing,
  UserRound,
  Share2,
  FolderSearch,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Activity,
  Split,
  Users,
  ScrollText,
  FileBarChart,
  Database,
  Settings,
  RefreshCw,
  Bell,
  MoreVertical,
  LogOut,
  X,
  UserCircle,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    title: "",
    items: [{ label: "Tableau de bord", icon: LayoutGrid }],
  },
  {
    title: "ANALYSE",
    items: [
      { label: "Centre d'alertes", icon: BellRing, active: true },
      { label: "Contrôle & Pré-filtrage Sociétaire", icon: ShieldCheck },
      { label: "Client 360°", icon: UserRound },
      { label: "Graphe de relations", icon: Share2 },
      { label: "Investigations", icon: FolderSearch },
      { label: "Consultation Réglementaire", icon: FileText },
    ],
  },
  {
    title: "CONFORMITÉ",
    items: [
      { label: "Filtrage sanctions/PPE", icon: ShieldAlert },
      { label: "Risk Score", icon: Gauge },
      { label: "Détection comportementale", icon: Activity },
      { label: "Fractionnement", icon: Split },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Intégration des données", icon: Database },
      { label: "Utilisateurs & rôles", icon: Users },
      { label: "Journal d'audit", icon: ScrollText },
      { label: "Rapports réglementaires", icon: FileBarChart },
    ],
  },
  {
    title: "PARAMÈTRES",
    items: [
      { label: "Paramètres", icon: Settings },
      { label: "Synchronisation", icon: RefreshCw },
      { label: "Notifications", icon: Bell },
    ],
  },
]

type SidebarProps = {
  active: string
  onSelect: (label: string) => void
  userName?: string
  userRole?: string
  onLogout?: () => void
}

function SidebarContent({ active, onSelect, userName = "Aminata Touré", userRole = "Analyste conformité", onLogout }: SidebarProps) {
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2)
  const [menuOpen, setMenuOpen] = useState(false)
  const isGuichet = userRole.toLowerCase().includes("guichet")

  const sectionsToRender: NavSection[] = isGuichet
    ? [
        {
          title: "",
          items: [{ label: "Tableau de bord", icon: LayoutGrid }],
        },
        {
          title: "SÉCURITÉ & CONFORMITÉ GUICHET",
          items: [
            { label: "Contrôle & Pré-filtrage Sociétaire", icon: ShieldCheck },
            { label: "Filtrage sanctions/PPE", icon: ShieldAlert },
          ],
        },
        {
          title: "COMMUNICATION & ALERTES",
          items: [
            { label: "Notifications", icon: Bell },
          ],
        },
      ]
    : sections

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm">
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <div className="flex items-baseline">
          <span className="text-[17px] font-bold tracking-tight text-slate-900">LAKANA</span>
          <span className="ml-1.5 text-[11px] font-medium text-slate-400">le bouclier</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 sidebar-scroll">
        {sectionsToRender.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {section.title && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = active === item.label
              return (
                <button
                  key={item.label}
                  onClick={() => onSelect(item.label)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Keyboard shortcuts hint */}
      <div className="border-t border-slate-100 px-4 py-2.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono text-[9px]">⌘K</kbd>
            Recherche
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono text-[9px]">⌘N</kbd>
            Investigation
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono text-[9px]">⌘J</kbd>
            Thème
          </span>
        </div>
      </div>

      {/* Profile */}
      <div className="relative border-t border-slate-100 p-3">
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 cursor-pointer"
        >
          <Avatar className="h-9 w-9 border border-slate-200">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
            <p className="truncate text-xs text-slate-400">{userRole}</p>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn("rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600", menuOpen && "bg-slate-100 text-slate-600")}
            aria-label="Menu profil"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
        {menuOpen && (
          <div className="absolute bottom-14 right-3 z-50 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            <button
              onClick={() => {
                onSelect("Mon profil")
                setMenuOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <UserCircle className="h-4 w-4 text-slate-400" />
              Mon profil
            </button>
            <button
              onClick={() => { onSelect("Paramètres"); setMenuOpen(false) }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <Settings className="h-4 w-4 text-slate-400" />
              Paramètres
            </button>
            <button
              onClick={() => { onSelect("Notifications"); setMenuOpen(false) }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <Bell className="h-4 w-4 text-slate-400" />
              Notifications
            </button>
            <div className="my-1 h-px bg-slate-100" />
            <button
              onClick={() => { setMenuOpen(false); onLogout?.() }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export function DashboardSidebar(props: SidebarProps) {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white">
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
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer */}
      <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-slate-200 bg-white shadow-2xl animate-in slide-in-from-left duration-200">
        <button
          onClick={onClose}
          className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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

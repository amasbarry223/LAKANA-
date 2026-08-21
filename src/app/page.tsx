"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { LoginScreen } from "@/components/dashboard/login-screen"
import { AlertsCenterView } from "@/components/dashboard/views/alerts-center"
import { OverviewView } from "@/components/dashboard/views/overview"
import { Client360View } from "@/components/dashboard/views/client-360"
import { GraphView } from "@/components/dashboard/views/graph"
import { InvestigationsView } from "@/components/dashboard/views/investigations"
import { AssistantIAView } from "@/components/dashboard/views/assistant-ia"
import { RiskScoreView } from "@/components/dashboard/views/risk-score"
import { SanctionsView } from "@/components/dashboard/views/sanctions"
import { BehavioralView } from "@/components/dashboard/views/behavioral"
import { StructuringView } from "@/components/dashboard/views/structuring"
import { IntegrationView } from "@/components/dashboard/views/integration"
import { UsersView } from "@/components/dashboard/views/users"
import { AuditLogView } from "@/components/dashboard/views/audit-log"
import { ReportsView } from "@/components/dashboard/views/reports"
import { SettingsView } from "@/components/dashboard/views/settings"
import { SyncView } from "@/components/dashboard/views/sync"
import { NotificationsView } from "@/components/dashboard/views/notifications"

const views: Record<string, React.ComponentType> = {
  "Tableau de bord": OverviewView,
  "Centre d'alertes": AlertsCenterView,
  "Client 360°": Client360View,
  "Graphe de relations": GraphView,
  "Investigations": InvestigationsView,
  "Assistant IA": AssistantIAView,
  "Filtrage sanctions/PPE": SanctionsView,
  "Risk Score": RiskScoreView,
  "Détection comportementale": BehavioralView,
  "Fractionnement": StructuringView,
  "Intégration des données": IntegrationView,
  "Utilisateurs & rôles": UsersView,
  "Journal d'audit": AuditLogView,
  "Rapports réglementaires": ReportsView,
  "Paramètres": SettingsView,
  "Synchronisation": SyncView,
  "Notifications": NotificationsView,
}

export default function Home() {
  const [authed, setAuthed] = useState(false)
  const [role, setRole] = useState("Analyste conformité")
  const [active, setActive] = useState("Centre d'alertes")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  // Keyboard shortcuts: ⌘K (palette), ⌘N (new investigation), ⌘J (theme)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      } else if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault()
        toast.success("Nouvelle investigation créée", { description: "Dossier INV-246 ouvert — en attente de documentation." })
        setActive("Investigations")
      } else if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault()
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [theme, setTheme])

  // Listen for cross-view navigation events (from cards/rows that should navigate)
  useEffect(() => {
    const handler = (e: Event) => {
      const label = (e as CustomEvent).detail as string
      if (label) setActive(label)
    }
    window.addEventListener("lakana-navigate", handler as EventListener)
    return () => window.removeEventListener("lakana-navigate", handler as EventListener)
  }, [])

  const handleLogin = (r: string) => {
    setAuthed(true)
    setRole(r)
    if (typeof window !== "undefined") localStorage.setItem("lakana-auth", r)
  }

  const handleLogout = () => {
    setAuthed(false)
    if (typeof window !== "undefined") localStorage.removeItem("lakana-auth")
    setActive("Centre d'alertes")
  }

  if (!authed) {
    return <LoginScreen onLogin={handleLogin} />
  }

  // Derive a display name from role for the sidebar profile
  const userName =
    role === "Analyste conformité" ? "Aminata Touré"
    : role === "Responsable conformité" ? "Fatoumata Koné"
    : role === "Administrateur système" ? "Seydou Traoré"
    : role === "Auditeur (lecture seule)" ? "Mariam Coulibaly"
    : "Utilisateur"

  const View = views[active] || AlertsCenterView

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        active={active}
        onSelect={setActive}
        userName={userName}
        userRole={role}
        onLogout={handleLogout}
      />
      <MobileSidebar
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        active={active}
        onSelect={setActive}
        userName={userName}
        userRole={role}
        onLogout={handleLogout}
      />
      <DashboardHeader onMenuClick={() => setMobileNavOpen(true)} onOpenSearch={() => setPaletteOpen(true)} />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNavigate={setActive}
        onAction={(action) => {
          switch (action) {
            case "new-investigation":
              toast.success("Nouvelle investigation créée", { description: "Dossier INV-246 ouvert — en attente de documentation." })
              setActive("Investigations")
              break
            case "export-audit":
              setActive("Journal d'audit")
              toast.info("Export du journal", { description: "Cliquez sur Exporter dans la page du journal d'audit." })
              break
            case "toggle-theme":
              setTheme(theme === "dark" ? "light" : "dark")
              break
            case "sync":
              setActive("Synchronisation")
              toast.success("Synchronisation lancée", { description: "Mise à jour de toutes les sources (OFF-02)." })
              break
            case "logout":
              handleLogout()
              break
          }
        }}
      />

      {/* Main content offset for fixed sidebar (lg+) and fixed header */}
      <main className="lg:pl-[260px] pt-16">
        <div className="p-4 md:p-6">
          <View />
        </div>
      </main>
    </div>
  )
}

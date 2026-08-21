"use client"

import { useState, useEffect, useCallback } from "react"
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
import { ProfileView } from "@/components/dashboard/views/profile"
import { DashboardProvider, useDashboard } from "@/lib/dashboard-context"
import type { NavigateDetail } from "@/lib/navigate"
import { NewInvestigationModal } from "@/components/dashboard/new-investigation-modal"
import { MOCK_ALERTS } from "@/lib/alerts-data"

function DashboardListeners() {
  const { openNewInvestigation, setSelectedClientId, setSelectedInvestigationRef, investigations } = useDashboard()

  useEffect(() => {
    const onNew = () => {
      openNewInvestigation()
    }
    const onPayload = (e: Event) => {
      const opts = (e as CustomEvent).detail as NavigateDetail["options"]
      if (opts?.clientId) setSelectedClientId(opts.clientId)
      if (opts?.investigationRef) setSelectedInvestigationRef(opts.investigationRef)
      if (opts?.alertRef) {
        const existing = investigations.find(
          (i) => i.alertRef === opts.alertRef && i.status === "en_cours"
        )
        if (existing) {
          setSelectedInvestigationRef(existing.ref)
        } else {
          const alert = MOCK_ALERTS.find((a) => a.ref === opts.alertRef)
          openNewInvestigation({
            alertRef: opts.alertRef,
            client: alert?.client,
            type: alert?.type,
            score: alert?.score,
          })
        }
      }
    }
    window.addEventListener("lakana-new-investigation", onNew)
    window.addEventListener("lakana-navigate-payload", onPayload as EventListener)
    return () => {
      window.removeEventListener("lakana-new-investigation", onNew)
      window.removeEventListener("lakana-navigate-payload", onPayload as EventListener)
    }
  }, [openNewInvestigation, setSelectedClientId, setSelectedInvestigationRef, investigations])

  return null
}

const views: Record<string, React.ComponentType<{ onLogout?: () => void }>> = {
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
  "Mon profil": ProfileView,
}

function roleToUserName(role: string) {
  if (role === "Analyste conformité") return "Aminata Touré"
  if (role === "Responsable conformité") return "Fatoumata Koné"
  if (role === "Administrateur système") return "Seydou Traoré"
  if (role === "Auditeur (lecture seule)") return "Mariam Coulibaly"
  return "Utilisateur"
}

function DashboardContent({
  role,
  onLogout,
}: {
  role: string
  onLogout: () => void
}) {
  const [active, setActive] = useState("Centre d'alertes")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { newInvestigationOpen, newInvestigationPrefill, closeNewInvestigation } = useDashboard()
  const userName = roleToUserName(role)

  const handleNavigate = useCallback((label: string, options?: NavigateDetail["options"]) => {
    setActive(label)
    if (options?.clientId || options?.alertRef || options?.investigationRef) {
      window.dispatchEvent(
        new CustomEvent("lakana-navigate-payload", { detail: options })
      )
    }
  }, [])

  const handleNewInvestigation = useCallback(() => {
    window.dispatchEvent(new CustomEvent("lakana-new-investigation"))
    setActive("Investigations")
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as NavigateDetail | string
      if (typeof detail === "string") {
        if (detail) setActive(detail)
      } else if (detail?.label) {
        handleNavigate(detail.label, detail.options)
      }
    }
    window.addEventListener("lakana-navigate", handler as EventListener)
    return () => window.removeEventListener("lakana-navigate", handler as EventListener)
  }, [handleNavigate])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      } else if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault()
        handleNewInvestigation()
      } else if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault()
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [theme, setTheme, handleNewInvestigation])

  const View = views[active] || AlertsCenterView

  return (
    <>
      <DashboardListeners />
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <DashboardSidebar
          active={active}
          onSelect={setActive}
          userName={userName}
          userRole={role}
          onLogout={onLogout}
        />
        <MobileSidebar
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          active={active}
          onSelect={setActive}
          userName={userName}
          userRole={role}
          onLogout={onLogout}
        />
        <DashboardHeader
          onMenuClick={() => setMobileNavOpen(true)}
          onOpenSearch={() => setPaletteOpen(true)}
          onNavigate={handleNavigate}
          onNewInvestigation={handleNewInvestigation}
        />
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onNavigate={handleNavigate}
          onAction={(action) => {
            switch (action) {
              case "new-investigation":
                handleNewInvestigation()
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
                onLogout()
                break
            }
          }}
        />

        <main className="lg:pl-[260px] pt-16">
          <div className="p-4 md:p-6">
            <View onLogout={active === "Mon profil" ? onLogout : undefined} />
          </div>
        </main>
      </div>

      <NewInvestigationModal
        open={newInvestigationOpen}
        onClose={closeNewInvestigation}
        prefill={newInvestigationPrefill}
      />
    </>
  )
}

function DashboardShell({
  role,
  onLogout,
}: {
  role: string
  onLogout: () => void
}) {
  const userName = roleToUserName(role)
  const userRole = role

  return (
    <DashboardProvider userName={userName} userRole={userRole}>
      <DashboardContent role={role} onLogout={onLogout} />
    </DashboardProvider>
  )
}

export default function Home() {
  const [authed, setAuthed] = useState(false)
  const [role, setRole] = useState("Analyste conformité")
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("lakana-auth")
    if (saved) {
      setAuthed(true)
      setRole(saved)
    }
    setAuthChecked(true)
  }, [])

  const handleLogin = (r: string) => {
    setAuthed(true)
    setRole(r)
    localStorage.setItem("lakana-auth", r)
  }

  const handleLogout = () => {
    setAuthed(false)
    localStorage.removeItem("lakana-auth")
  }

  if (!authChecked) {
    return null
  }

  if (!authed) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return <DashboardShell role={role} onLogout={handleLogout} />
}

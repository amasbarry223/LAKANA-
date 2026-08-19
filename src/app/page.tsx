"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { AlertsCenterView } from "@/components/dashboard/views/alerts-center"
import { OverviewView } from "@/components/dashboard/views/overview"
import { Client360View } from "@/components/dashboard/views/client-360"
import { GraphView } from "@/components/dashboard/views/graph"
import { InvestigationsView } from "@/components/dashboard/views/investigations"
import { RiskScoreView } from "@/components/dashboard/views/risk-score"
import { SanctionsView } from "@/components/dashboard/views/sanctions"
import { BehavioralView } from "@/components/dashboard/views/behavioral"
import { StructuringView } from "@/components/dashboard/views/structuring"
import { UsersView } from "@/components/dashboard/views/users"
import { AuditLogView } from "@/components/dashboard/views/audit-log"
import { ReportsView } from "@/components/dashboard/views/reports"
import { SyncView } from "@/components/dashboard/views/sync"

const views: Record<string, React.ComponentType> = {
  "Tableau de bord": OverviewView,
  "Centre d'alertes": AlertsCenterView,
  "Client 360°": Client360View,
  "Graphe de relations": GraphView,
  "Investigations": InvestigationsView,
  "Filtrage sanctions/PPE": SanctionsView,
  "Risk Score": RiskScoreView,
  "Détection comportementale": BehavioralView,
  "Fractionnement": StructuringView,
  "Utilisateurs & rôles": UsersView,
  "Journal d'audit": AuditLogView,
  "Rapports réglementaires": ReportsView,
  "Synchronisation": SyncView,
}

export default function Home() {
  const [active, setActive] = useState("Centre d'alertes")
  const View = views[active] || AlertsCenterView

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar active={active} onSelect={setActive} />
      <DashboardHeader />

      {/* Main content offset for fixed sidebar (lg+) and fixed header */}
      <main className="lg:pl-[260px] pt-16">
        <div className="p-4 md:p-6">
          <View />
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { AlertsCenterView } from "@/components/dashboard/views/alerts-center"
import { Client360View } from "@/components/dashboard/views/client-360"
import { InvestigationsView } from "@/components/dashboard/views/investigations"
import { RiskScoreView } from "@/components/dashboard/views/risk-score"

export default function Home() {
  const [active, setActive] = useState("Centre d'alertes")

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar active={active} onSelect={setActive} />
      <DashboardHeader />

      {/* Main content offset for fixed sidebar (lg+) and fixed header */}
      <main className="lg:pl-[260px] pt-16">
        <div className="p-4 md:p-6">
          {active === "Centre d'alertes" && <AlertsCenterView />}
          {active === "Client 360°" && <Client360View />}
          {active === "Investigations" && <InvestigationsView />}
          {active === "Risk Score" && <RiskScoreView />}
          {/* Other nav items fall back to alerts center */}
          {active !== "Centre d'alertes" &&
            active !== "Client 360°" &&
            active !== "Investigations" &&
            active !== "Risk Score" && <AlertsCenterView />}
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, AlertTriangle, Gauge, Clock, FolderSearch } from "lucide-react"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { statsService } from "@/services/statsService"

type Metric = {
  label: string
  value: string
  sublabel: string
  color: "rose" | "amber" | "indigo" | "emerald" | "slate"
  icon: React.ComponentType<{ className?: string }>
  nav: string
}

const FALLBACK_METRICS: Metric[] = [
  {
    label: "Alertes bloquantes",
    value: "—",
    sublabel: "Urgence immédiate (gel)",
    color: "rose",
    icon: ShieldAlert,
    nav: "Centre d'alertes",
  },
  {
    label: "Alertes à analyser",
    value: "—",
    sublabel: "Revue humaine requise",
    color: "amber",
    icon: AlertTriangle,
    nav: "Centre d'alertes",
  },
  {
    label: "Score de risque moyen",
    value: "—",
    sublabel: "Sur l'ensemble du portefeuille",
    color: "indigo",
    icon: Gauge,
    nav: "Client 360°",
  },
  {
    label: "Investigations en cours",
    value: "—",
    sublabel: "Dossiers d'enquête ouverts",
    color: "emerald",
    icon: FolderSearch,
    nav: "Investigations",
  },
]

const COLOR_CLASSES: Record<Metric["color"], { bg: string; text: string; iconBg: string }> = {
  rose: { bg: "hover:border-rose-300", text: "text-rose-700", iconBg: "bg-rose-50 text-rose-600" },
  amber: { bg: "hover:border-amber-300", text: "text-amber-700", iconBg: "bg-amber-50 text-amber-600" },
  indigo: { bg: "hover:border-indigo-300", text: "text-indigo-700", iconBg: "bg-indigo-50 text-indigo-600" },
  emerald: { bg: "hover:border-emerald-300", text: "text-emerald-700", iconBg: "bg-emerald-50 text-emerald-600" },
  slate: { bg: "hover:border-slate-300", text: "text-slate-700", iconBg: "bg-slate-50 text-slate-600" },
}

export function MetricCards() {
  const [metrics, setMetrics] = useState<Metric[]>(FALLBACK_METRICS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsService
      .getDashboardOverview()
      .then((res) => {
        const s = res.stats
        const bloquantes = s.alertes_bloquantes ?? 0
        const aAnalyser = s.alertes_analyser ?? Math.max(0, s.alertes_actives - bloquantes)
        const investigations = s.investigations_en_cours ?? 0

        setMetrics([
          {
            label: "Alertes bloquantes",
            value: String(bloquantes),
            sublabel: bloquantes > 0 ? "Mesure conservatoire requise" : "Aucun blocage actif",
            color: bloquantes > 0 ? "rose" : "slate",
            icon: ShieldAlert,
            nav: "Centre d'alertes",
          },
          {
            label: "Alertes à analyser",
            value: String(aAnalyser),
            sublabel: `${aAnalyser} alertes à instruire`,
            color: "amber",
            icon: AlertTriangle,
            nav: "Centre d'alertes",
          },
          {
            label: "Score de risque moyen",
            value: s.score_moyen || "—",
            sublabel: "Classification globale portefeuille",
            color: "indigo",
            icon: Gauge,
            nav: "Client 360°",
          },
          {
            label: "Investigations en cours",
            value: String(investigations),
            sublabel: `${investigations} dossiers en instruction`,
            color: "emerald",
            icon: FolderSearch,
            nav: "Investigations",
          },
        ])
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((m) => {
        const conf = COLOR_CLASSES[m.color]
        const Icon = m.icon
        return (
          <div
            key={m.label}
            onClick={() => navigateTo(m.nav)}
            className={cn(
              "group cursor-pointer rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:shadow-sm",
              conf.bg
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{m.label}</span>
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", conf.iconBg)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <p className={cn("mt-2 text-2xl font-bold tracking-tight text-slate-900", loading && "animate-pulse text-slate-300")}>
              {m.value}
            </p>

            <p className="mt-1 text-xs text-slate-400 truncate">{m.sublabel}</p>
          </div>
        )
      })}
    </div>
  )
}

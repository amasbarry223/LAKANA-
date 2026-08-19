"use client"

import { ChevronRight, ArrowUpRight, ArrowDownRight, Split, ShieldAlert, Activity, UserPlus, Gauge, FileSearch } from "lucide-react"
import { Line, LineChart, ResponsiveContainer } from "recharts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Alert = {
  ref: string
  client: string
  score: number
  type: string
  level: "bloquante" | "analyser" | "informative"
  up: boolean
  delta: string
  color: string
  data: { v: number }[]
  icon: React.ComponentType<{ className?: string }>
}

const spark = (n: number, base: number, vol: number, trend: number) => {
  const arr: { v: number }[] = []
  for (let i = 0; i < n; i++) {
    arr.push({ v: base + trend * i + Math.sin(i * 1.3) * vol })
  }
  return arr
}

const alerts: Alert[] = [
  {
    ref: "ALR-241",
    client: "Traoré, Moussa",
    score: 87,
    type: "Fractionnement",
    level: "bloquante",
    up: true,
    delta: "9 pts",
    color: "#EF4444",
    data: spark(14, 70, 3, 1.2),
    icon: Split,
  },
  {
    ref: "ALR-238",
    client: "Diarra, Fatoumata",
    score: 72,
    type: "Correspondance PPE",
    level: "bloquante",
    up: true,
    delta: "5 pts",
    color: "#EF4444",
    data: spark(14, 60, 2.5, 0.9),
    icon: ShieldAlert,
  },
  {
    ref: "ALR-235",
    client: "Keïta, Ibrahim",
    score: 64,
    type: "Volume inhabituel",
    level: "analyser",
    up: true,
    delta: "4 pts",
    color: "#F59E0B",
    data: spark(14, 55, 2, 0.6),
    icon: Activity,
  },
  {
    ref: "ALR-229",
    client: "Coulibaly, Aïssata",
    score: 58,
    type: "Fréquence anormale",
    level: "analyser",
    up: true,
    delta: "3 pts",
    color: "#F59E0B",
    data: spark(14, 50, 2.5, 0.5),
    icon: Gauge,
  },
  {
    ref: "ALR-225",
    client: "Touré, Seydou",
    score: 41,
    type: "Relations inhabituelles",
    level: "informative",
    up: false,
    delta: "2 pts",
    color: "#06B6D4",
    data: spark(14, 46, 2, -0.4),
    icon: UserPlus,
  },
  {
    ref: "ALR-219",
    client: "Sangaré, Mariam",
    score: 36,
    type: "Comportement atypique",
    level: "informative",
    up: false,
    delta: "6 pts",
    color: "#06B6D4",
    data: spark(14, 44, 1.8, -0.6),
    icon: FileSearch,
  },
]

const levelLabel: Record<Alert["level"], string> = {
  bloquante: "Bloquante",
  analyser: "À analyser",
  informative: "Informative",
}

function MiniSpark({ color, data }: { color: string; data: { v: number }[] }) {
  return (
    <div className="h-7 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function FunnelPerformance() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Alertes prioritaires
        </h3>
        <button
          onClick={() => toast.info("Toutes les alertes", { description: "Affichage de la liste complète des 111 alertes actives." })}
          className="text-xs font-semibold text-indigo-600 hover:underline"
        >
          Tout voir
        </button>
      </div>

      <div className="mt-4 space-y-1">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          <span>Client</span>
          <span className="text-right">Score</span>
          <span className="text-right">Tendance</span>
        </div>

        {alerts.map((a) => (
          <div
            key={a.ref}
            onClick={() => toast.info(`Alerte ${a.ref} ouverte`, { description: `${a.client} — ${a.type} — score ${a.score}/100` })}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${a.color}15` }}
              >
                <a.icon className="h-4 w-4" style={{ color: a.color }} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{a.client}</p>
                <p className="text-[11px] text-slate-400">
                  {a.ref} • {a.type}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{a.score}/100</p>
              <p
                className={cn(
                  "flex items-center justify-end gap-0.5 text-[11px] font-medium",
                  a.up ? "text-rose-600" : "text-emerald-600"
                )}
              >
                {a.up ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {a.delta}
              </p>
            </div>
            <MiniSpark color={a.color} data={a.data} />
          </div>
        ))}
      </div>

      <button
        onClick={() => toast.info("Centre d'alertes", { description: "Redirection vers la liste complète des alertes." })}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        Voir toutes les alertes
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

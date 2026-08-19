"use client"

import { useState } from "react"
import {
  Gauge,
  Split,
  TrendingUp,
  ShieldAlert,
  Activity,
  Share2,
  Info,
  RotateCw,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Section 14 du cahier des charges — système de scoring
type Criterion = {
  code: string
  label: string
  weight: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const criteria: Criterion[] = [
  {
    code: "FRC",
    label: "Fractionnement potentiel",
    weight: 30,
    description: "Transactions groupées juste sous le seuil de déclaration.",
    icon: Split,
    color: "#6366F1",
  },
  {
    code: "VOL",
    label: "Volume inhabituel",
    weight: 25,
    description: "Écart significatif entre le montant moyen récent et historique.",
    icon: TrendingUp,
    color: "#3B82F6",
  },
  {
    code: "FREQ",
    label: "Fréquence anormale",
    weight: 20,
    description: "Nombre de transactions récentes largement supérieur à l'habitude.",
    icon: Activity,
    color: "#06B6D4",
  },
  {
    code: "PPE",
    label: "Correspondance PPE/sanctions",
    weight: 15,
    description: "Client classé PPE ou correspondance sur une liste officielle.",
    icon: ShieldAlert,
    color: "#F59E0B",
  },
  {
    code: "REL",
    label: "Relations inhabituelles",
    weight: 10,
    description: "Liens avec des comptes ou bénéficiaires déjà signalés.",
    icon: Share2,
    color: "#A78BFA",
  },
]

// Score distribution across clients
const distribution = [
  { range: "0-20", count: 4821, color: "#10B981" },
  { range: "21-40", count: 3120, color: "#10B981" },
  { range: "41-60", count: 1845, color: "#F59E0B" },
  { range: "61-80", count: 612, color: "#F59E0B" },
  { range: "81-100", count: 187, color: "#EF4444" },
]

// Score history (average over time)
const scoreHistory = [
  { date: "Jul 7", score: 38 },
  { date: "Jul 14", score: 40 },
  { date: "Jul 21", score: 39 },
  { date: "Jul 28", score: 41 },
  { date: "Aug 4", score: 40 },
  { date: "Aug 11", score: 43 },
  { date: "Aug 18", score: 41 },
  { date: "Aug 25", score: 42 },
]

// Rule weights table
const rules = [
  { id: "R-FRC-01", desc: "Somme cumulée > seuil (48h)", module: "Fractionnement", points: 30 },
  { id: "R-VOL-01", desc: "Montant > 3× moyenne historique", module: "Volume", points: 25 },
  { id: "R-FREQ-01", desc: "> 10 transactions / jour", module: "Fréquence", points: 20 },
  { id: "R-PPE-01", desc: "Correspondance exacte liste PPE", module: "PPE", points: 15 },
  { id: "R-PPE-02", desc: "Correspondance fuzzy > 85%", module: "PPE", points: 12 },
  { id: "R-REL-01", desc: "Virement vers bénéficiaire signalé", module: "Relations", points: 10 },
  { id: "R-REL-02", desc: "Graphe : cluster à risque détecté", module: "Relations", points: 8 },
]

export function RiskScoreView() {
  const [weights, setWeights] = useState(criteria.map((c) => c.weight))
  const total = weights.reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
          Risk Score
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Score dynamique sur 100 points, explicable et auditable (section 14).
        </p>
      </div>

      {/* Criteria cards with weights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {criteria.map((c, i) => (
          <div
            key={c.code}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${c.color}15` }}
              >
                <c.icon className="h-4 w-4" style={{ color: c.color }} />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {c.code}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900">{c.label}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{c.description}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900">{c.weight}</span>
              <span className="text-xs text-slate-400">/ 100 pts</span>
            </div>
            {/* Weight slider (SCR-04) */}
            <input
              type="range"
              min={0}
              max={40}
              value={weights[i]}
              onChange={(e) => {
                const next = [...weights]
                next[i] = Number(e.target.value)
                setWeights(next)
              }}
              className="mt-2 w-full accent-indigo-600"
              aria-label={`Pondération ${c.label}`}
            />
          </div>
        ))}
      </div>

      {/* Note about weight adjustment */}
      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2.5 text-xs text-indigo-700">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>
          Les pondérations sont ajustables par le responsable conformité (SCR-04).
          Total actuel : <strong>{total}/100 pts</strong>. Toute modification est
          historisée et tracée.
        </span>
      </div>

      {/* Row 2: Distribution + History */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Distribution des scores clients
            </h3>
            <Badge variant="outline" className="border-slate-200 text-slate-500">
              10 585 clients
            </Badge>
          </div>
          <div className="mt-4 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "#F8FAFC" }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Clients">
                  {distribution.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Faible (0-40)</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Moyen (41-80)</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />Élevé (81-100)</span>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Évolution du score moyen
            </h3>
            <button
              onClick={() => toast.success("Recalcul lancé", { description: "Risk Score recalculé pour tous les clients (SCR-03)." })}
              className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              <RotateCw className="h-3 w-3" />
              Recalculer
            </button>
          </div>
          <div className="mt-4 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreHistory} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <YAxis domain={[30, 50]} tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
                  formatter={(v: number) => [`${v}/100`, "Score moyen"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#6366F1" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Historique des scores successifs conservé par client (SCR-05).
          </p>
        </div>
      </div>

      {/* Rules table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Règles de scoring actives
          </h3>
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
            {rules.length} règles
          </Badge>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4 font-semibold">Code</th>
                <th className="pb-2 pr-4 font-semibold">Description</th>
                <th className="pb-2 pr-4 font-semibold">Module</th>
                <th className="pb-2 text-right font-semibold">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rules.map((r) => (
                <tr key={r.id} onClick={() => toast.info(`Règle ${r.id}`, { description: r.desc })} className="cursor-pointer py-2">
                  <td className="py-2.5 pr-4">
                    <span className="font-mono text-xs font-semibold text-indigo-600">{r.id}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-700">{r.desc}</td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {r.module}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-slate-900">+{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

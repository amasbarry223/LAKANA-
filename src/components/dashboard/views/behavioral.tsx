"use client"

import { Activity, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Deviation = {
  id: string
  client: string
  metric: "Montant moyen" | "Fréquence" | "Solde consolidé"
  habituel: number
  recent: number
  ecart: number
  unit: string
  alertLevel: "bloquante" | "analyser" | "informative"
}

const deviations: Deviation[] = [
  { id: "CMP-241", client: "Traoré, Moussa", metric: "Montant moyen", habituel: 850, recent: 3400, ecart: 300, unit: "k FCFA", alertLevel: "bloquante" },
  { id: "CMP-238", client: "Diarra, Fatoumata", metric: "Fréquence", habituel: 4, recent: 11, ecart: 175, unit: "tx/sem", alertLevel: "bloquante" },
  { id: "CMP-235", client: "Keïta, Ibrahim", metric: "Montant moyen", habituel: 1100, recent: 2100, ecart: 91, unit: "k FCFA", alertLevel: "analyser" },
  { id: "CMP-229", client: "Coulibaly, Aïssata", metric: "Fréquence", habituel: 6, recent: 9, ecart: 50, unit: "tx/sem", alertLevel: "analyser" },
  { id: "CMP-225", client: "Touré, Seydou", metric: "Solde consolidé", habituel: 2200, recent: 5800, ecart: 164, unit: "k FCFA", alertLevel: "informative" },
  { id: "CMP-219", client: "Sangaré, Mariam", metric: "Montant moyen", habituel: 740, recent: 690, ecart: -7, unit: "k FCFA", alertLevel: "informative" },
]

const levelColor: Record<Deviation["alertLevel"], string> = {
  bloquante: "bg-rose-50 text-rose-700 border-rose-200",
  analyser: "bg-amber-50 text-amber-700 border-amber-200",
  informative: "bg-cyan-50 text-cyan-700 border-cyan-200",
}

// Bar chart comparing habituel vs recent
const chartData = deviations.slice(0, 5).map((d) => ({
  name: d.client.split(", ")[0],
  Habituel: d.metric === "Fréquence" ? d.habituel * 100 : d.habituel,
  Récent: d.metric === "Fréquence" ? d.recent * 100 : d.recent,
}))

export function BehavioralView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Détection comportementale</h1>
        <p className="mt-1 text-sm text-slate-500">Écarts entre comportement récent et historique du client (CMP-01/02).</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Écarts bloquants", value: deviations.filter((d) => d.alertLevel === "bloquante").length, color: "#EF4444" },
          { label: "À analyser", value: deviations.filter((d) => d.alertLevel === "analyser").length, color: "#F59E0B" },
          { label: "Informatifs", value: deviations.filter((d) => d.alertLevel === "informative").length, color: "#06B6D4" },
          { label: "Seuil de déclenchement", value: "≥ 50%", color: "#6366F1" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <p className="text-[13px] font-medium text-slate-500">{s.label}</p>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Comparison chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Comportement habituel vs récent</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" />Habituel</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" />Récent</span>
          </div>
        </div>
        <div className="mt-4 h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <ReferenceLine y={100} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "Seuil alerte", fontSize: 10, fill: "#EF4444" }} />
              <Bar dataKey="Habituel" fill="#CBD5E1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Récent" fill="#6366F1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deviations table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Écarts détectés ({deviations.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2 font-semibold">Client</th>
                <th className="px-3 py-2 font-semibold">Métrique</th>
                <th className="px-3 py-2 text-right font-semibold">Habituel</th>
                <th className="px-3 py-2 text-right font-semibold">Récent</th>
                <th className="px-3 py-2 text-right font-semibold">Écart</th>
                <th className="px-5 py-2 font-semibold">Niveau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deviations.map((d) => (
                <tr key={d.id} onClick={() => toast.info(`Écart ${d.id}`, { description: `${d.client} — ${d.metric}: ${d.ecart}% d'écart.` })} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{d.client}</p>
                    <p className="text-[11px] text-slate-400">{d.id}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{d.metric}</td>
                  <td className="px-3 py-3 text-right text-slate-600">
                    {d.habituel.toLocaleString("fr-FR")} <span className="text-[10px] text-slate-400">{d.unit}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900">
                    {d.recent.toLocaleString("fr-FR")} <span className="text-[10px] text-slate-400">{d.unit}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={cn(
                      "inline-flex items-center gap-0.5 font-semibold",
                      d.ecart > 50 ? "text-rose-600" : d.ecart > 0 ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {d.ecart > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      +{d.ecart}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={cn("border capitalize", levelColor[d.alertLevel])}>
                      {d.alertLevel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2.5 text-xs text-indigo-700">
        <Activity className="h-3.5 w-3.5 shrink-0" />
        <span>Le solde consolidé sur plusieurs comptes est pris en compte (CMP-03). Seuils ajustables par le responsable conformité (CMP-04).</span>
      </div>
    </div>
  )
}

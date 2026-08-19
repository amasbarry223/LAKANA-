"use client"

import { Activity, ShieldAlert, Users, AlertTriangle, TrendingUp, Clock, ChevronRight } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const stats = [
  { label: "Clients filtrés", value: "10 585", icon: Users, color: "#6366F1", delta: "+312 cette semaine" },
  { label: "Alertes actives", value: "111", icon: AlertTriangle, color: "#EF4444", delta: "24 bloquantes" },
  { label: "Investigations en cours", value: "3", icon: Clock, color: "#F59E0B", delta: "2 en attente > 24h" },
  { label: "Score moyen", value: "42/100", icon: TrendingUp, color: "#10B981", delta: "+3 pts vs sem." },
]

const trend = [
  { date: "S1", alertes: 42, investigations: 8 },
  { date: "S2", alertes: 51, investigations: 11 },
  { date: "S3", alertes: 38, investigations: 6 },
  { date: "S4", alertes: 67, investigations: 14 },
  { date: "S5", alertes: 55, investigations: 9 },
  { date: "S6", alertes: 73, investigations: 12 },
  { date: "S7", alertes: 64, investigations: 10 },
  { date: "S8", alertes: 87, investigations: 15 },
]

const modules = [
  { name: "Filtrage sanctions/PPE", code: "FLT", count: 1203, color: "#6366F1" },
  { name: "Détection comportementale", code: "CMP", count: 287, color: "#06B6D4" },
  { name: "Fractionnement", code: "FRC", count: 167, color: "#F59E0B" },
  { name: "Risk Score recalculé", code: "SCR", count: 456, color: "#10B981" },
]

export function OverviewView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-500">Vue d'ensemble de l'activité de conformité LAKANA.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-slate-500">{s.label}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${s.color}15` }}>
                <s.icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-[11px] text-slate-400">{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Trend */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Activité — 8 dernières semaines</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" />Alertes</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Investigations</span>
          </div>
        </div>
        <div className="mt-4 h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="ovA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366F1" stopOpacity={0} /></linearGradient>
                <linearGradient id="ovI" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="100%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Area type="monotone" dataKey="alertes" stroke="#6366F1" strokeWidth={2} fill="url(#ovA)" isAnimationActive={false} />
              <Area type="monotone" dataKey="investigations" stroke="#F59E0B" strokeWidth={2} fill="url(#ovI)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module activity + compliance status */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Activité par module</h3>
          <div className="mt-4 space-y-3">
            {modules.map((m) => (
              <div key={m.code} onClick={() => toast.info("Module ouvert", { description: m.name })} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${m.color}15` }}>
                  <Activity className="h-4 w-4" style={{ color: m.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{m.name}</p>
                  <p className="text-[11px] text-slate-400">Module {m.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{m.count.toLocaleString("fr-FR")}</p>
                  <p className="text-[11px] text-slate-400">signaux</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">État de conformité</h3>
          <div className="mt-4 space-y-3">
            <div onClick={() => toast.success("Listes sanctions", { description: "ONU · GAFI · CENTIF — à jour." })} className="flex cursor-pointer items-center justify-between rounded-lg bg-emerald-50 p-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Listes sanctions à jour</span>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">ONU · GAFI · CENTIF</Badge>
            </div>
            <div onClick={() => toast.success("Connecteurs", { description: "3/3 connecteurs opérationnels." })} className="flex cursor-pointer items-center justify-between rounded-lg bg-emerald-50 p-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Connecteurs opérationnels</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700">3/3</span>
            </div>
            <div onClick={() => toast.warning("Investigations en attente", { description: "2 investigations dépassent 24h." })} className="flex cursor-pointer items-center justify-between rounded-lg bg-amber-50 p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Investigations &gt; 24h</span>
              </div>
              <span className="text-xs font-semibold text-amber-700">2 en attente</span>
            </div>
            <div onClick={() => toast.error("Alertes critiques", { description: "5 alertes bloquantes non traitées." })} className="flex cursor-pointer items-center justify-between rounded-lg bg-rose-50 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span className="text-sm font-medium text-rose-800">Alertes bloquantes non traitées</span>
              </div>
              <span className="text-xs font-semibold text-rose-700">5 critiques</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

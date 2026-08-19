"use client"

import { useState } from "react"
import {
  User,
  ShieldAlert,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Share2,
  ChevronRight,
  MapPin,
  Briefcase,
  Calendar,
  CreditCard,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Client = {
  id: string
  name: string
  dob: string
  profession: string
  city: string
  ppe: boolean
  riskLevel: "Élevé" | "Moyen" | "Faible"
  score: number
  accounts: { type: string; number: string; balance: number }[]
  factors: { label: string; points: number; max: number }[]
  alerts: { ref: string; type: string; date: string; level: string }[]
  txData: { date: string; montant: number }[]
}

const clients: Client[] = [
  {
    id: "CLI-1042",
    name: "Traoré, Moussa",
    dob: "14/03/1978",
    profession: "Commerçant",
    city: "Bamako",
    ppe: false,
    riskLevel: "Élevé",
    score: 87,
    accounts: [
      { type: "Compte courant", number: "•••• 4821", balance: 4850000 },
      { type: "Compte épargne", number: "•••• 7390", balance: 12000000 },
    ],
    factors: [
      { label: "Fractionnement potentiel", points: 28, max: 30 },
      { label: "Volume inhabituel", points: 22, max: 25 },
      { label: "Fréquence anormale", points: 18, max: 20 },
      { label: "Correspondance PPE", points: 0, max: 15 },
      { label: "Relations inhabituelles", points: 19, max: 10 },
    ],
    alerts: [
      { ref: "ALR-241", type: "Fractionnement", date: "25/08/2026", level: "bloquante" },
      { ref: "ALR-198", type: "Volume inhabituel", date: "18/08/2026", level: "analyser" },
      { ref: "ALR-156", type: "Fréquence anormale", date: "02/08/2026", level: "analyser" },
    ],
    txData: [
      { date: "Jul 1", montant: 1200000 },
      { date: "Jul 8", montant: 980000 },
      { date: "Jul 15", montant: 1450000 },
      { date: "Jul 22", montant: 3200000 },
      { date: "Jul 29", montant: 2800000 },
      { date: "Aug 5", montant: 3400000 },
      { date: "Aug 12", montant: 2950000 },
      { date: "Aug 19", montant: 4100000 },
      { date: "Aug 26", montant: 3850000 },
    ],
  },
  {
    id: "CLI-1087",
    name: "Diarra, Fatoumata",
    dob: "22/11/1985",
    profession: "Fonctionnaire",
    city: "Sikasso",
    ppe: true,
    riskLevel: "Élevé",
    score: 72,
    accounts: [
      { type: "Compte courant", number: "•••• 2055", balance: 2300000 },
    ],
    factors: [
      { label: "Correspondance PPE", points: 15, max: 15 },
      { label: "Volume inhabituel", points: 20, max: 25 },
      { label: "Fractionnement potentiel", points: 15, max: 30 },
      { label: "Fréquence anormale", points: 12, max: 20 },
      { label: "Relations inhabituelles", points: 10, max: 10 },
    ],
    alerts: [
      { ref: "ALR-238", type: "Correspondance PPE", date: "24/08/2026", level: "bloquante" },
      { ref: "ALR-101", type: "Volume inhabituel", date: "10/08/2026", level: "analyser" },
    ],
    txData: [
      { date: "Jul 1", montant: 450000 },
      { date: "Jul 8", montant: 520000 },
      { date: "Jul 15", montant: 480000 },
      { date: "Jul 22", montant: 1100000 },
      { date: "Jul 29", montant: 950000 },
      { date: "Aug 5", montant: 1250000 },
      { date: "Aug 12", montant: 980000 },
      { date: "Aug 19", montant: 1400000 },
      { date: "Aug 26", montant: 1150000 },
    ],
  },
  {
    id: "CLI-1103",
    name: "Keïta, Ibrahim",
    dob: "03/07/1990",
    profession: "Entrepreneur",
    city: "Kayes",
    ppe: false,
    riskLevel: "Moyen",
    score: 64,
    accounts: [
      { type: "Compte courant", number: "•••• 9912", balance: 6800000 },
      { type: "Compte épargne", number: "•••• 3344", balance: 3200000 },
    ],
    factors: [
      { label: "Volume inhabituel", points: 24, max: 25 },
      { label: "Fréquence anormale", points: 16, max: 20 },
      { label: "Fractionnement potentiel", points: 14, max: 30 },
      { label: "Correspondance PPE", points: 0, max: 15 },
      { label: "Relations inhabituelles", points: 10, max: 10 },
    ],
    alerts: [
      { ref: "ALR-235", type: "Volume inhabituel", date: "23/08/2026", level: "analyser" },
    ],
    txData: [
      { date: "Jul 1", montant: 800000 },
      { date: "Jul 8", montant: 920000 },
      { date: "Jul 15", montant: 1100000 },
      { date: "Jul 22", montant: 1350000 },
      { date: "Jul 29", montant: 1250000 },
      { date: "Aug 5", montant: 1600000 },
      { date: "Aug 12", montant: 1750000 },
      { date: "Aug 19", montant: 1900000 },
      { date: "Aug 26", montant: 2100000 },
    ],
  },
]

const levelColor: Record<string, string> = {
  bloquante: "bg-rose-50 text-rose-700 border-rose-200",
  analyser: "bg-amber-50 text-amber-700 border-amber-200",
  informative: "bg-cyan-50 text-cyan-700 border-cyan-200",
}

function TxTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p className="text-xs text-slate-500">
        {Number(payload[0].value).toLocaleString("fr-FR")} FCFA
      </p>
    </div>
  )
}

export function Client360View() {
  const [selected, setSelected] = useState(0)
  const client = clients[selected]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">
            Client 360°
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vue consolidée : profil, comptes, score, alertes et relations.
          </p>
        </div>
        {/* Client selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {clients.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelected(i)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                selected === i
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <User className="h-3.5 w-3.5" />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Profile + Risk Score */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Profile card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
              {client.name.split(", ")[1]?.[0]}
              {client.name.split(", ")[0][0]}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900">{client.name}</h3>
              <p className="text-xs text-slate-400">{client.id}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border",
                client.riskLevel === "Élevé"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : client.riskLevel === "Moyen"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              Risque {client.riskLevel}
            </Badge>
            {client.ppe && (
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700 gap-1">
                <ShieldAlert className="h-3 w-3" />
                PPE
              </Badge>
            )}
          </div>

          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2.5 text-sm">
              <Briefcase className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">Profession :</span>
              <span className="font-medium text-slate-800">{client.profession}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">Né(e) le :</span>
              <span className="font-medium text-slate-800">{client.dob}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">Ville :</span>
              <span className="font-medium text-slate-800">{client.city}</span>
            </div>
          </div>

          {/* Accounts */}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Comptes ({client.accounts.length})
            </p>
            <div className="space-y-2">
              {client.accounts.map((acc, i) => (
                <div key={i} onClick={() => toast.info(`Compte ${acc.number}`, { description: `${acc.type} — solde ${acc.balance.toLocaleString("fr-FR")} FCFA` })} className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-slate-50 p-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                    <CreditCard className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800">{acc.type}</p>
                    <p className="text-[11px] text-slate-400">{acc.number}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {acc.balance.toLocaleString("fr-FR")}
                    <span className="ml-1 text-[10px] font-normal text-slate-400">FCFA</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Score breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Risk Score — facteurs explicatifs</h3>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
              Section 14 — Scoring
            </Badge>
          </div>

          <div className="mt-4 flex items-center gap-5">
            {/* Gauge */}
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={client.score >= 70 ? "#EF4444" : client.score >= 40 ? "#F59E0B" : "#10B981"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(client.score / 100) * 314} 314`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-slate-900">{client.score}</span>
                <span className="text-[10px] font-medium text-slate-400">/ 100</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500">
                Score calculé à partir de règles pondérées explicites. Un score élevé
                indique un écart marqué avec le profil attendu — il justifie une revue
                humaine, sans présumer d'une fraude.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Dernier recalcul : 25/08/2026 à 14:32 — recalculé à chaque transaction (SCR-03)
              </p>
            </div>
          </div>

          {/* Factors */}
          <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
            {client.factors.map((f) => (
              <div key={f.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{f.label}</span>
                  <span className="text-slate-500">
                    <span className="font-semibold text-slate-900">{f.points}</span> / {f.max} pts
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      f.points / f.max > 0.7 ? "bg-rose-500" : f.points / f.max > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${(f.points / f.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Transactions chart + Relationship graph */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Transaction history */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Historique des transactions
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <TrendingUp className="h-3.5 w-3.5" />
              9 dernières semaines
            </div>
          </div>
          <div className="mt-4 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={client.txData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<TxTooltip />} />
                <Area type="monotone" dataKey="montant" stroke="#6366F1" strokeWidth={2} fill="url(#txGrad)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Relationship graph (simplified SVG) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Graphe de relations</h3>
            <Share2 className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-1 text-xs text-slate-400">Liens financiers (GRF-01)</p>

          <div className="relative mt-3 h-[220px] w-full overflow-hidden rounded-lg bg-slate-50">
            <svg className="h-full w-full" viewBox="0 0 240 220">
              {/* edges */}
              <line x1="120" y1="110" x2="50" y2="40" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="120" y1="110" x2="200" y2="50" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="120" y1="110" x2="40" y2="170" stroke="#EF4444" strokeWidth="2" />
              <line x1="120" y1="110" x2="195" y2="175" stroke="#CBD5E1" strokeWidth="1.5" />
              <line x1="40" y1="170" x2="195" y2="175" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
              {/* center node (client) */}
              <circle cx="120" cy="110" r="22" fill="#6366F1" />
              <text x="120" y="114" textAnchor="middle" className="fill-white text-[9px] font-bold">Client</text>
              {/* other nodes */}
              <circle cx="50" cy="40" r="14" fill="#fff" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="50" y="43" textAnchor="middle" className="fill-slate-500 text-[7px] font-medium">Cpte 1</text>
              <circle cx="200" cy="50" r="14" fill="#fff" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="200" y="53" textAnchor="middle" className="fill-slate-500 text-[7px] font-medium">Cpte 2</text>
              <circle cx="40" cy="170" r="16" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
              <text x="40" y="173" textAnchor="middle" className="fill-rose-700 text-[7px] font-bold">Bénéf. signalé</text>
              <circle cx="195" cy="175" r="14" fill="#fff" stroke="#CBD5E1" strokeWidth="1.5" />
              <text x="195" y="178" textAnchor="middle" className="fill-slate-500 text-[7px] font-medium">Bénéf. 2</text>
            </svg>
            <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded-md bg-white/90 px-2 py-1 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />Alerte active</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" />Relation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Alerts history */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Historique des alertes
          </h3>
          <button className="text-xs font-semibold text-indigo-600 hover:underline">
            Voir le centre d'alertes
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {client.alerts.map((a) => (
            <div
              key={a.ref}
              onClick={() => toast.info(`Alerte ${a.ref}`, { description: `${a.type} — ${a.date}.` })}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <AlertTriangle className="h-4 w-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{a.type}</p>
                <p className="text-[11px] text-slate-400">{a.ref} • {a.date}</p>
              </div>
              <Badge variant="outline" className={cn("border capitalize", levelColor[a.level])}>
                {a.level}
              </Badge>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

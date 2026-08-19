"use client"

import { ChevronRight, ArrowUpRight, ArrowDownRight, Filter, Sparkles, Zap, UserPlus, Target, Trophy } from "lucide-react"
import { Line, LineChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

type Funnel = {
  name: string
  rate: number
  delta: string
  up: boolean
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

const funnels: Funnel[] = [
  {
    name: "Signup to Paid",
    rate: 12.48,
    delta: "2.1%",
    up: true,
    color: "#06B6D4",
    data: spark(14, 10, 0.8, 0.2),
    icon: Filter,
  },
  {
    name: "Free Trial to Paid",
    rate: 18.72,
    delta: "1.4%",
    up: true,
    color: "#14B8A6",
    data: spark(14, 16, 0.6, 0.2),
    icon: Sparkles,
  },
  {
    name: "Product Activation",
    rate: 31.43,
    delta: "0.8%",
    up: true,
    color: "#14B8A6",
    data: spark(14, 30, 0.5, 0.1),
    icon: Zap,
  },
  {
    name: "Demo to Trial",
    rate: 24.18,
    delta: "1.2%",
    up: true,
    color: "#06B6D4",
    data: spark(14, 23, 0.7, 0.1),
    icon: UserPlus,
  },
  {
    name: "Lead to Opportunity",
    rate: 16.09,
    delta: "1.7%",
    up: false,
    color: "#EF4444",
    data: spark(14, 18, 0.9, -0.15),
    icon: Target,
  },
  {
    name: "Opportunity to Win",
    rate: 28.91,
    delta: "2.4%",
    up: false,
    color: "#EF4444",
    data: spark(14, 31, 1.1, -0.2),
    icon: Trophy,
  },
]

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
          Funnel Performance
        </h3>
        <button className="text-xs font-semibold text-indigo-600 hover:underline">
          View All
        </button>
      </div>

      <div className="mt-4 space-y-1">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
          <span>Funnel</span>
          <span className="text-right">Rate</span>
          <span className="text-right">Trend</span>
        </div>

        {funnels.map((f) => (
          <div
            key={f.name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${f.color}15` }}
              >
                <f.icon className="h-4 w-4" style={{ color: f.color }} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{f.name}</p>
                <p className="text-[11px] text-slate-400">Last 14 days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{f.rate}%</p>
              <p
                className={cn(
                  "flex items-center justify-end gap-0.5 text-[11px] font-medium",
                  f.up ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {f.up ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {f.delta}
              </p>
            </div>
            <MiniSpark color={f.color} data={f.data} />
          </div>
        ))}
      </div>

      <button className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
        View all funnels
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

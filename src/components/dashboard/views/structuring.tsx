"use client"

import { useState, useEffect } from "react"
import { Split, Clock, TrendingUp, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { useDashboard } from "@/lib/dashboard-context"

type Sequence = {
  id: string
  client: string
  txCount: number
  totalAmount: number
  threshold: number
  window: string
  startDate: string
  status: "bloquante" | "analyser"
  txs: { date: string; amount: number }[]
}

const sequences: Sequence[] = [
  {
    id: "FRC-241",
    client: "Traoré, Moussa",
    txCount: 6,
    totalAmount: 4800000,
    threshold: 1000000,
    window: "48h",
    startDate: "25/08/2026",
    status: "bloquante",
    txs: [
      { date: "25/08 09:12", amount: 920000 },
      { date: "25/08 11:45", amount: 880000 },
      { date: "25/08 14:20", amount: 950000 },
      { date: "25/08 16:30", amount: 760000 },
      { date: "26/08 08:15", amount: 690000 },
      { date: "26/08 10:50", amount: 600000 },
    ],
  },
  {
    id: "FRC-239",
    client: "Diarra, Fatoumata",
    txCount: 4,
    totalAmount: 3650000,
    threshold: 1000000,
    window: "24h",
    startDate: "24/08/2026",
    status: "bloquante",
    txs: [
      { date: "24/08 10:00", amount: 950000 },
      { date: "24/08 12:30", amount: 880000 },
      { date: "24/08 15:10", amount: 920000 },
      { date: "24/08 18:40", amount: 900000 },
    ],
  },
  {
    id: "FRC-235",
    client: "Keïta, Ibrahim",
    txCount: 5,
    totalAmount: 4100000,
    threshold: 1000000,
    window: "72h",
    startDate: "22/08/2026",
    status: "analyser",
    txs: [
      { date: "22/08 09:00", amount: 850000 },
      { date: "22/08 21:00", amount: 780000 },
      { date: "23/08 14:00", amount: 820000 },
      { date: "23/08 22:00", amount: 750000 },
      { date: "24/08 11:00", amount: 900000 },
    ],
  },
  {
    id: "FRC-229",
    client: "Coulibaly, Aïssata",
    txCount: 3,
    totalAmount: 2850000,
    threshold: 1000000,
    window: "48h",
    startDate: "20/08/2026",
    status: "analyser",
    txs: [
      { date: "20/08 10:00", amount: 950000 },
      { date: "21/08 09:00", amount: 900000 },
      { date: "21/08 16:00", amount: 1000000 },
    ],
  },
]

const fmt = (n: number) => n.toLocaleString("fr-FR")

export function StructuringView() {
  const { addInvestigation } = useDashboard()
  const [selectedSeq, setSelectedSeq] = useState<Sequence | null>(null)

  const openInvestigation = (s: Sequence) => {
    const ref = addInvestigation({
      client: s.client,
      alertRef: s.id,
      type: "Fractionnement",
      score: Math.min(100, Math.round((s.totalAmount / s.threshold) * 10)),
    })
    toast.success("Investigation ouverte", { description: `Dossier ${ref} — ${s.client} (séquence ${s.id}).` })
    navigateTo("Investigations", { investigationRef: ref })
  }

  // Escape key closes the detail modal
  useEffect(() => {
    if (!selectedSeq) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedSeq(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedSeq])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Détection du fractionnement</h1>
        <p className="mt-1 text-sm text-slate-500">Séquences sous le seuil de déclaration, cumul dépassant (FRC-01/02).</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Séquences détectées", value: sequences.length, color: "#6366F1" },
          { label: "Bloquantes", value: sequences.filter((s) => s.status === "bloquante").length, color: "#EF4444" },
          { label: "À analyser", value: sequences.filter((s) => s.status === "analyser").length, color: "#F59E0B" },
          { label: "Seuil de déclaration", value: "1 000 000 FCFA", color: "#10B981" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <p className="text-[13px] font-medium text-slate-500">{s.label}</p>
            </div>
            <p className="mt-1.5 text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sequences */}
      <div className="space-y-4">
        {sequences.map((s) => (
          <div key={s.id} onClick={() => setSelectedSeq(s)} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <Split className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{s.client}</h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border capitalize",
                        s.status === "bloquante"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {s.id} • {s.txCount} transactions • fenêtre {s.window} • depuis le {s.startDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Cumul</p>
                  <p className="text-lg font-bold text-rose-600">{fmt(s.totalAmount)}</p>
                  <p className="text-[10px] text-slate-400">FCFA</p>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Seuil unitaire</p>
                  <p className="text-sm font-semibold text-slate-700">{fmt(s.threshold)}</p>
                  <p className="text-[10px] text-slate-400">FCFA / tx</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openInvestigation(s)
                  }}
                  className="ml-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Ouvrir investigation
                </button>
              </div>
            </div>

            {/* Individual transactions */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {s.txs.map((tx, i) => (
                <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <p className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-2.5 w-2.5" />
                    {tx.date}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {fmt(tx.amount)}
                    <span className="ml-1 text-[10px] font-normal text-slate-400">FCFA</span>
                  </p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <TrendingUp className="h-2.5 w-2.5 text-amber-500" />
                    <span className="text-[10px] text-amber-600">sous seuil</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar showing cumulative vs threshold */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-500">Cumul vs seuil de déclaration global</span>
                <span className="font-semibold text-rose-600">
                  {Math.round((s.totalAmount / (s.threshold * 4)) * 100)}% du seuil ×4
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
                  style={{ width: `${Math.min(100, (s.totalAmount / (s.threshold * 5)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2.5 text-xs text-indigo-700">
        <Split className="h-3.5 w-3.5 shrink-0" />
        <span>Les séquences sont regroupées et présentées comme un ensemble cohérent (FRC-02). Fenêtre temporelle et seuil paramétrables (FRC-03).</span>
      </div>

      {/* Sequence detail modal (FRC-02) */}
      {selectedSeq && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedSeq(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Détail de la séquence</h3>
                <p className="mt-0.5 text-xs text-slate-400">{selectedSeq.id} — {selectedSeq.client}</p>
              </div>
              <button
                onClick={() => setSelectedSeq(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Client + status */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <Split className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedSeq.client}</p>
                  <p className="text-[11px] text-slate-400">Client — séquence {selectedSeq.id}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "border capitalize",
                  selectedSeq.status === "bloquante"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {selectedSeq.status}
              </Badge>
            </div>

            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { label: "Transactions", value: String(selectedSeq.txCount) },
                { label: "Cumul (FCFA)", value: fmt(selectedSeq.totalAmount) },
                { label: "Seuil unit. (FCFA)", value: fmt(selectedSeq.threshold) },
                { label: "Fenêtre", value: selectedSeq.window },
                { label: "Début", value: selectedSeq.startDate },
              ].map((st) => (
                <div key={st.label} className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400">{st.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{st.value}</p>
                </div>
              ))}
            </div>

            {/* Cumulative progress bar */}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-500">Cumul vs seuil de déclaration global</span>
                <span className="font-semibold text-rose-600">
                  {Math.round((selectedSeq.totalAmount / (selectedSeq.threshold * 4)) * 100)}% du seuil ×4
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
                  style={{ width: `${Math.min(100, (selectedSeq.totalAmount / (selectedSeq.threshold * 5)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Transactions table */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-slate-600">
                Transactions individuelles ({selectedSeq.txs.length})
              </p>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">Date</th>
                      <th className="px-3 py-2 text-right font-semibold">Montant (FCFA)</th>
                      <th className="px-3 py-2 text-center font-semibold">Indicateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedSeq.txs.map((tx, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-300" />
                            {tx.date}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">{fmt(tx.amount)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                            <TrendingUp className="h-3 w-3" />
                            sous seuil
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedSeq(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  if (selectedSeq) openInvestigation(selectedSeq)
                  setSelectedSeq(null)
                }}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Ouvrir investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

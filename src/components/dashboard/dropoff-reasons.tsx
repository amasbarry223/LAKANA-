"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

// Top motifs d'alerte — basés sur les critères de scoring (section 14 du cahier des charges)
type Reason = {
  label: string
  pct: number
  color: string
}

const reasons: Reason[] = [
  { label: "Fractionnement potentiel", pct: 34.9, color: "#6366F1" },
  { label: "Volume inhabituel", pct: 23.1, color: "#3B82F6" },
  { label: "Correspondance PPE/sanctions", pct: 18.3, color: "#06B6D4" },
  { label: "Fréquence anormale", pct: 14.7, color: "#67E8F9" },
  { label: "Relations inhabituelles", pct: 8.9, color: "#CBD5E1" },
]

// Noms malian réalistes pour la répartition mockée
const malianNames = [
  "Traoré, Moussa",
  "Diarra, Aïcha",
  "Keïta, Ibrahim",
  "Coulibaly, Fatoumata",
  "Touré, Modibo",
  "Sangaré, Aminata",
  "Diabaté, Sékou",
  "Camara, Kadiatou",
  "Diallo, Oumar",
  "Cissé, Mariam",
]

function buildBreakdown(reason: Reason) {
  // Mock deterministic par index de label pour avoir 4-5 lignes stables
  const seed = reason.label.length
  const rows = 4 + (seed % 2) // 4 ou 5 lignes
  const used = new Set<number>()
  const items: { client: string; alerts: number; pct: number }[] = []
  let remaining = 100
  for (let i = 0; i < rows; i++) {
    let idx = (seed + i * 3) % malianNames.length
    while (used.has(idx)) idx = (idx + 1) % malianNames.length
    used.add(idx)
    const share = i === rows - 1 ? remaining : Math.max(4, Math.round((remaining / (rows - i)) * 0.6))
    remaining -= share
    const alerts = Math.max(1, Math.round((share / 100) * 456 * (reason.pct / 100)))
    items.push({ client: malianNames[idx], alerts, pct: share })
  }
  return items
}

export function DropoffReasons() {
  const max = Math.max(...reasons.map((r) => r.pct))
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null)

  useEffect(() => {
    if (!selectedReason) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedReason(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedReason])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Top motifs d'alerte
        </h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          Ce mois
        </span>
      </div>

      <div className="mt-5 space-y-3.5">
        {reasons.map((r) => (
          <div key={r.label} onClick={() => setSelectedReason(r)} className="cursor-pointer">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{r.label}</span>
              <span className="font-semibold text-slate-900">{r.pct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(r.pct / max) * 100}%`,
                  background: r.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
        Basé sur 456 alertes ce mois
      </p>

      {/* Detail modal */}
      {selectedReason && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedReason(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Détail du motif</h3>
                <p className="mt-0.5 text-xs text-slate-400">{selectedReason.label}</p>
              </div>
              <button
                onClick={() => setSelectedReason(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Part du motif</span>
                <span className="font-semibold text-slate-900">{selectedReason.pct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(selectedReason.pct / max) * 100}%`,
                    background: selectedReason.color,
                  }}
                />
              </div>
            </div>

            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Répartition par client / module
              </h4>
              <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-3 py-2 font-medium">Client</th>
                      <th className="px-3 py-2 text-right font-medium">Alertes</th>
                      <th className="px-3 py-2 text-right font-medium">Part</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {buildBreakdown(selectedReason).map((row) => (
                      <tr key={row.client}>
                        <td className="px-3 py-2 text-slate-700">{row.client}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{row.alerts}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">{row.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={() => setSelectedReason(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

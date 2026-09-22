import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { statsService, type FunnelReason } from "@/services/statsService"

const DEFAULT_REASONS: FunnelReason[] = [
  { label: "Fractionnement potentiel", count: 2, pct: 34.9, color: "#6366F1", clients: [] },
  { label: "Volume inhabituel", count: 2, pct: 23.1, color: "#3B82F6", clients: [] },
  { label: "Correspondance PPE/sanctions", count: 1, pct: 18.3, color: "#06B6D4", clients: [] },
  { label: "Fréquence anormale", count: 1, pct: 14.7, color: "#67E8F9", clients: [] },
]

export function DropoffReasons() {
  const [reasons, setReasons] = useState<FunnelReason[]>(DEFAULT_REASONS)
  const [selectedReason, setSelectedReason] = useState<FunnelReason | null>(null)
  const [totalAlerts, setTotalAlerts] = useState<number | null>(null)

  useEffect(() => {
    statsService.getFunnelAnalytics().then((res) => {
      if (res?.reasons && res.reasons.length > 0) {
        setReasons(res.reasons)
      }
      if (res?.total_alerts !== undefined) {
        setTotalAlerts(res.total_alerts)
      }
    }).catch(() => {})
  }, [])

  const max = Math.max(...reasons.map((r) => r.pct), 1)

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
          Top motifs d&apos;alerte
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
        {totalAlerts !== null
          ? `Basé sur ${totalAlerts} alerte${totalAlerts > 1 ? "s" : ""} ce mois`
          : `Basé sur ${reasons.reduce((s, r) => s + r.count, 0)} alertes ce mois`}
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
                      <th className="px-3 py-2 text-center font-medium">Réf.</th>
                      <th className="px-3 py-2 text-right font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReason.clients && selectedReason.clients.length > 0 ? (
                      selectedReason.clients.map((row) => (
                        <tr key={row.ref}>
                          <td className="px-3 py-2 text-slate-700 font-medium">{row.client}</td>
                          <td className="px-3 py-2 text-center text-xs text-slate-500">{row.ref}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">{row.score}/100</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-3 py-3 text-center text-xs text-slate-400">
                          {selectedReason.count} alerte(s) liée(s) à ce motif en base de données.
                        </td>
                      </tr>
                    )}
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

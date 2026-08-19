"use client"

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

export function DropoffReasons() {
  const max = Math.max(...reasons.map((r) => r.pct))
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
          <div key={r.label}>
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
    </div>
  )
}

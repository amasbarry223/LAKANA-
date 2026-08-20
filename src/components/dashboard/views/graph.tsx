"use client"

import { useState } from "react"
import { Share2, ZoomIn, ZoomOut, Maximize, Download } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"

type Node = {
  id: string
  label: string
  type: "client" | "compte" | "beneficiaire" | "alerte"
  x: number
  y: number
  alert?: boolean
}

type Edge = {
  from: string
  to: string
  label?: string
  strong?: boolean
}

const nodes: Node[] = [
  { id: "c1", label: "Traoré M.", type: "client", x: 400, y: 250 },
  { id: "a1", label: "Cpte 4821", type: "compte", x: 220, y: 140 },
  { id: "a2", label: "Cpte 7390", type: "compte", x: 580, y: 140 },
  { id: "b1", label: "Diallo F.", type: "beneficiaire", x: 120, y: 360, alert: true },
  { id: "b2", label: "Sow A.", type: "beneficiaire", x: 300, y: 400 },
  { id: "b3", label: "Camara K.", type: "beneficiaire", x: 500, y: 410, alert: true },
  { id: "b4", label: "Bah M.", type: "beneficiaire", x: 680, y: 360 },
  { id: "c2", label: "Keïta I.", type: "client", x: 720, y: 480 },
]

const edges: Edge[] = [
  { from: "c1", to: "a1" },
  { from: "c1", to: "a2" },
  { from: "a1", to: "b1", strong: true, label: "3,2M FCFA" },
  { from: "a1", to: "b2", label: "850k" },
  { from: "a2", to: "b3", strong: true, label: "4,1M FCFA" },
  { from: "a2", to: "b4", label: "1,2M" },
  { from: "b3", to: "c2", strong: true, label: "lien signalé" },
]

const nodeStyle: Record<Node["type"], { fill: string; stroke: string; textColor: string; r: number }> = {
  client: { fill: "#6366F1", stroke: "#4F46E5", textColor: "#fff", r: 28 },
  compte: { fill: "#fff", stroke: "#CBD5E1", textColor: "#475569", r: 22 },
  beneficiaire: { fill: "#fff", stroke: "#CBD5E1", textColor: "#475569", r: 20 },
  alerte: { fill: "#FEE2E2", stroke: "#EF4444", textColor: "#991B1B", r: 20 },
}

const legend = [
  { label: "Client", color: "#6366F1" },
  { label: "Compte", color: "#CBD5E1" },
  { label: "Bénéficiaire", color: "#94A3B8" },
  { label: "Signalé (alerte active)", color: "#EF4444" },
]

export function GraphView() {
  const [zoom, setZoom] = useState(1)
  const [selected, setSelected] = useState<string | null>("c1")
  const [hovered, setHovered] = useState<string | null>(null)

  const sel = nodes.find((n) => n.id === selected)
  const connectedNodes = sel
    ? edges
        .filter((e) => e.from === sel.id || e.to === sel.id)
        .map((e) => {
          const otherId = e.from === sel.id ? e.to : e.from
          const other = nodes.find((n) => n.id === otherId)
          return { node: other, label: e.label, strong: e.strong }
        })
    : []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Graphe de relations</h1>
          <p className="mt-1 text-sm text-slate-500">Liens financiers entre clients, comptes et bénéficiaires (GRF-01).</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
            <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-xs font-semibold text-slate-500">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={() => setZoom(1)} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => toast.success("Graphe exporté", { description: "Le graphe a été exporté comme pièce jointe (GRF-04)." })}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exporter (GRF-04)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        {/* Graph canvas */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 xl:col-span-3">
          <div className="relative h-[560px] w-full overflow-hidden rounded-lg bg-slate-50">
            <svg
              className="h-full w-full"
              viewBox="0 0 800 560"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
            >
              {/* edges */}
              {edges.map((e, i) => {
                const from = nodes.find((n) => n.id === e.from)!
                const to = nodes.find((n) => n.id === e.to)!
                const midX = (from.x + to.x) / 2
                const midY = (from.y + to.y) / 2
                return (
                  <g key={i}>
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={e.strong ? "#EF4444" : "#CBD5E1"}
                      strokeWidth={e.strong ? 2.5 : 1.5}
                      strokeDasharray={e.strong ? "0" : "4 3"}
                    />
                    {e.label && (
                      <g>
                        <rect x={midX - 28} y={midY - 9} width={56} height={16} rx={4} fill="#fff" stroke="#E2E8F0" />
                        <text x={midX} y={midY + 2} textAnchor="middle" className="fill-slate-500 text-[8px] font-medium">{e.label}</text>
                      </g>
                    )}
                  </g>
                )
              })}
              {/* nodes */}
              {nodes.map((n) => {
                const isAlert = n.alert || n.type === "alerte"
                const style = isAlert ? nodeStyle.alerte : nodeStyle[n.type]
                const isSel = selected === n.id
                const isHov = hovered === n.id
                return (
                  <g
                    key={n.id}
                    onClick={() => setSelected(n.id)}
                    onMouseEnter={() => setHovered(n.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer"
                  >
                    <title>{`${n.label} — ${n.type}`}</title>
                    {isHov && !isSel && (
                      <circle cx={n.x} cy={n.y} r={style.r + 5} fill="none" stroke={style.stroke} strokeWidth={1.5} opacity={0.35} />
                    )}
                    {isSel && <circle cx={n.x} cy={n.y} r={style.r + 6} fill="none" stroke="#6366F1" strokeWidth={2} strokeDasharray="3 3" />}
                    <circle cx={n.x} cy={n.y} r={style.r} fill={style.fill} stroke={style.stroke} strokeWidth={isAlert ? 2.5 : 1.5} />
                    <text x={n.x} y={n.y + 3} textAnchor="middle" className="text-[9px] font-semibold" fill={style.textColor}>{n.label}</text>
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-lg bg-white/95 px-3 py-2 shadow-sm">
              {legend.map((l) => (
                <span key={l.label} className="flex items-center gap-1 text-[11px] text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Node detail */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Nœud sélectionné</h3>
          </div>
          {sel ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Type</p>
                <p className="mt-0.5 text-sm font-semibold capitalize text-slate-900">{sel.type}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Libellé</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{sel.label}</p>
              </div>
              {sel.alert && (
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                  Alerté — nœud à risque (GRF-03)
                </Badge>
              )}
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-medium text-slate-400">Connexions</p>
                <p className="mt-1 text-sm text-slate-700">
                  {connectedNodes.length} lien(s) financier(s)
                </p>
                {connectedNodes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {connectedNodes.map((c, i) => (
                      <li key={i} className="text-xs text-slate-600">
                        • {c.node?.label} <span className="text-slate-400">({c.node?.type})</span>
                        {c.label && (
                          <span className={cn("ml-1", c.strong ? "font-semibold text-rose-600" : "text-slate-400")}>
                            — {c.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => navigateTo("Client 360°")}
                className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Voir Client 360°
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Cliquez sur un nœud pour voir le détail.</p>
          )}
        </div>
      </div>
    </div>
  )
}

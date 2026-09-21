"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  User,
  Building2,
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  Search,
  RefreshCw,
  Layers,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { clientService } from "@/services/clientService"
import { graphService } from "@/services/graphService"
import type { Client } from "@/models/client"
import type { FinancialGraph, GraphNode, GraphEdge } from "@/models/graph"

type InternalNode = {
  id: string
  label: string
  type: "client" | "compte" | "beneficiaire" | "alerte"
  x: number
  y: number
  alert?: boolean
  details?: Record<string, any>
}

type InternalEdge = {
  from: string
  to: string
  label?: string
  strong?: boolean
}

const nodeStyle: Record<InternalNode["type"], { fill: string; stroke: string; textColor: string; r: number }> = {
  client: { fill: "#6366F1", stroke: "#4F46E5", textColor: "#fff", r: 30 },
  compte: { fill: "#fff", stroke: "#CBD5E1", textColor: "#475569", r: 24 },
  beneficiaire: { fill: "#fff", stroke: "#CBD5E1", textColor: "#475569", r: 22 },
  alerte: { fill: "#FEE2E2", stroke: "#EF4444", textColor: "#991B1B", r: 22 },
}

const legend = [
  { label: "Client émetteur", color: "#6366F1" },
  { label: "Compte bancaire", color: "#CBD5E1" },
  { label: "Bénéficiaire régulier", color: "#94A3B8" },
  { label: "Alerte Rouge (≥ 15M / jour ou > 2x habituel)", color: "#EF4444" },
]

export function GraphView() {
  const [zoom, setZoom] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Clients & Sélection
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Données du graphe
  const [graphData, setGraphData] = useState<{ nodes: InternalNode[]; edges: InternalEdge[] }>({
    nodes: [],
    edges: [],
  })

  // 1. Charger les clients
  useEffect(() => {
    clientService.getClients().then((data) => {
      setClients(data)
      if (data.length > 0) {
        // Sélectionner par défaut un client avec des transactions
        const preferred = data.find((c) => c.riskScore && c.riskScore >= 70) || data[0]
        setSelectedClient(preferred)
      }
    }).catch(() => {
      toast.error("Impossible de charger les clients")
    })
  }, [])

  // 2. Charger le graphe pour le client sélectionné
  const loadGraph = useCallback(async (client: Client) => {
    setLoading(true)
    try {
      const g = await graphService.getClientGraph(client.id)
      
      const internalNodes: InternalNode[] = g.noeuds.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type as any,
        x: n.x,
        y: n.y,
        alert: n.alert,
        details: n.details,
      }))

      const internalEdges: InternalEdge[] = g.liens.map((l) => ({
        from: l.from_node,
        to: l.to_node,
        label: l.label,
        strong: l.strong,
      }))

      setGraphData({ nodes: internalNodes, edges: internalEdges })
      if (internalNodes.length > 0) {
        setSelected(internalNodes[0].id)
      }
    } catch {
      toast.error("Erreur lors du calcul du graphe financier")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadGraph(selectedClient)
    }
  }, [selectedClient, loadGraph])

  const nodes = graphData.nodes
  const edges = graphData.edges

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

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.trim().toLowerCase()
    if (!q) return true

    const matchNom = c.nom?.toLowerCase().includes(q)
    const matchPrenom = c.prenom?.toLowerCase().includes(q)
    const matchRaison = c.raisonSociale?.toLowerCase().includes(q)
    const matchCode = c.codeClient?.toLowerCase().includes(q)
    const matchCni = c.pieceIdentite?.toLowerCase().includes(q)
    const matchComptes = c.comptes?.some((acc) =>
      acc.numeroCompte?.toLowerCase().includes(q) ||
      (typeof acc === "object" && (acc as any).numero_compte?.toLowerCase().includes(q))
    )

    return Boolean(matchNom || matchPrenom || matchRaison || matchCode || matchCni || matchComptes)
  })

  return (
    <div className="space-y-5">
      {/* En-tête avec sélecteur de client */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] flex items-center gap-3">
            <Share2 className="w-7 h-7 text-indigo-600" />
            Graphe de relations financières
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cartographie des liens et flux suspects : <span className="font-semibold text-rose-600">Alerte rouge si ≥ 15M FCFA / jour ou flux &gt; 2× transactions habituelles.</span>
          </p>
        </div>

        {/* Contrôles & Export */}
        <div className="flex items-center gap-3">
          {/* Sélecteur de Client */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              {selectedClient ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="max-w-[170px] truncate">
                    {selectedClient.typeClient === "Entreprise"
                      ? selectedClient.raisonSociale || selectedClient.nom
                      : `${selectedClient.prenom || ""} ${selectedClient.nom}`.trim()}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">({selectedClient.codeClient})</span>
                </div>
              ) : (
                "Choisir un client"
              )}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-2 animate-in fade-in-50 duration-150">
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Rechercher par nom, CNI ou N° de compte..."
                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 mt-1">
                  {filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Aucun client trouvé pour &quot;{clientSearch}&quot;
                    </div>
                  ) : (
                    filteredClients.map((c) => {
                      const comptesList = (c.comptes || [])
                        .map((a: any) => a.numeroCompte || a.numero_compte)
                        .filter(Boolean)

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedClient(c)
                            setDropdownOpen(false)
                          }}
                          className="p-2.5 flex items-start justify-between hover:bg-slate-50 rounded-lg cursor-pointer transition text-xs gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 truncate">
                              {c.typeClient === "Entreprise"
                                ? c.raisonSociale || c.nom
                                : `${c.prenom || ""} ${c.nom}`.trim()}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                              <span>{c.codeClient}</span>
                              {c.pieceIdentite && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-600 font-mono">CNI: {c.pieceIdentite}</span>
                                </>
                              )}
                              {c.estPpe && (
                                <span className="bg-amber-100 text-amber-800 font-medium px-1 rounded text-[10px]">PPE</span>
                              )}
                            </div>
                            {comptesList.length > 0 && (
                              <p className="text-[11px] text-indigo-600 font-mono mt-1 truncate">
                                💳 {comptesList.length} cpte(s) : {comptesList.join(", ")}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] shrink-0",
                              c.niveauRisque === "Élevé" ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200"
                            )}
                          >
                            {c.riskScore ?? 0} pts
                          </Badge>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Boutons Zoom */}
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              title="Zoom arrière"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-xs font-semibold text-slate-500">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              title="Zoom avant"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1)
                canvasRef.current?.requestFullscreen?.()
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              title="Plein écran"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => {
              const svg = svgRef.current
              if (!svg) return
              const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `graphe-${selectedClient?.codeClient || "flux"}.svg`
              a.click()
              URL.revokeObjectURL(url)
              toast.success("Graphe exporté", { description: "Fichier SVG téléchargé (GRF-04)." })
            }}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exporter (GRF-04)</span>
          </button>
        </div>
      </div>

      {/* Bannière d'explication de la règle active */}
      <div className="bg-gradient-to-r from-indigo-50 via-rose-50 to-amber-50 rounded-2xl border border-indigo-100 p-4 text-xs text-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Règle de Coloration Rouge Active (Conformité LAKANA) :</p>
            <p className="text-slate-500 mt-0.5">
              Un flux ou bénéficiaire passe en <span className="font-bold text-rose-600">ROUGE</span> si : (1) Le total des transactions journalières de l'individu atteint <span className="font-bold text-rose-600">15 000 000 FCFA</span> dans la journée, OU (2) Le montant dépasse <span className="font-bold text-rose-600">2× ses transactions habituelles</span>.
            </p>
          </div>
        </div>
        {selectedClient && (
          <Badge color="red" className="ml-3 shrink-0">
            Seuil 15M / 2× habituel
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        {/* Graph canvas */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 xl:col-span-3">
          <div ref={canvasRef} className="relative h-[560px] w-full overflow-hidden rounded-lg bg-slate-50/70 border border-slate-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Calcul des flux financiers en cours...</span>
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 text-sm">
                <Share2 className="w-8 h-8 text-slate-300" />
                <span>Aucune transaction enregistrée pour ce client</span>
              </div>
            ) : (
              <svg
                ref={svgRef}
                className="h-full w-full"
                viewBox="0 0 800 560"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                {/* Arêtes / Liens */}
                {edges.map((e, i) => {
                  const from = nodes.find((n) => n.id === e.from)
                  const to = nodes.find((n) => n.id === e.to)
                  if (!from || !to) return null
                  const midX = (from.x + to.x) / 2
                  const midY = (from.y + to.y) / 2
                  return (
                    <g key={i}>
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={e.strong ? "#EF4444" : "#CBD5E1"}
                        strokeWidth={e.strong ? 3 : 1.5}
                        strokeDasharray={e.strong ? "0" : "4 3"}
                      />
                      {e.label && (
                        <g>
                          <rect
                            x={midX - 34}
                            y={midY - 9}
                            width={68}
                            height={16}
                            rx={4}
                            fill="#fff"
                            stroke={e.strong ? "#FCA5A5" : "#E2E8F0"}
                            strokeWidth={e.strong ? 1.5 : 1}
                          />
                          <text
                            x={midX}
                            y={midY + 2}
                            textAnchor="middle"
                            className={cn(
                              "text-[8px] font-bold",
                              e.strong ? "fill-rose-600 font-mono" : "fill-slate-500"
                            )}
                          >
                            {e.label}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}

                {/* Nœuds */}
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
                      className="cursor-pointer transition-transform"
                    >
                      <title>{`${n.label} — ${n.type} ${isAlert ? "(Alerte Rouge)" : ""}`}</title>
                      {isHov && !isSel && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={style.r + 5}
                          fill="none"
                          stroke={style.stroke}
                          strokeWidth={1.5}
                          opacity={0.35}
                        />
                      )}
                      {isSel && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={style.r + 6}
                          fill="none"
                          stroke={isAlert ? "#EF4444" : "#6366F1"}
                          strokeWidth={2.5}
                          strokeDasharray="3 3"
                        />
                      )}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={style.r}
                        fill={style.fill}
                        stroke={style.stroke}
                        strokeWidth={isAlert ? 3 : 1.5}
                      />
                      <text
                        x={n.x}
                        y={n.y + 3}
                        textAnchor="middle"
                        className="text-[9px] font-semibold"
                        fill={style.textColor}
                      >
                        {n.label.length > 18 ? `${n.label.slice(0, 16)}…` : n.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            )}

            {/* Légende */}
            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-xl bg-white/95 backdrop-blur-sm px-3.5 py-2.5 shadow-md border border-slate-100">
              {legend.map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Panneau de détail du nœud sélectionné */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Share2 className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Détail du nœud</h3>
          </div>

          {sel ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Type d'entité</p>
                <p className="mt-0.5 text-sm font-semibold capitalize text-slate-900 flex items-center gap-1.5">
                  {sel.type === "client" && <User className="w-3.5 h-3.5 text-indigo-600" />}
                  {sel.type === "compte" && <Layers className="w-3.5 h-3.5 text-slate-600" />}
                  {sel.type === "beneficiaire" && <Building2 className="w-3.5 h-3.5 text-slate-600" />}
                  {sel.type}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Libellé</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 break-words">{sel.label}</p>
              </div>

              {sel.alert && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 space-y-1.5 animate-in fade-in-50">
                  <div className="flex items-center gap-1.5 text-red-700 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    Coloration Rouge — Alerte Active
                  </div>
                  <p className="text-xs text-red-600">
                    {sel.details?.motif_alerte ||
                      (sel.type === "client"
                        ? "Score de risque élevé, cumul journalier ≥ 15M ou transaction > 2x l'habitude."
                        : "Flux suspect : seuil journalier de 15M atteint ou montant > 2× transactions habituelles.")}
                  </p>
                </div>
              )}

              {/* Détails financiers */}
              {sel.details && (
                <div className="rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
                  <p className="font-semibold text-slate-700">Indicateurs financiers</p>
                  {sel.details.cumul != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cumul reçu :</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {Number(sel.details.cumul).toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  )}
                  {sel.details.avg_habituelle != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Moyenne habituelle :</span>
                      <span className="font-mono text-slate-700">
                        {Number(sel.details.avg_habituelle).toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  )}
                  {sel.details.seuil_2x_habituel != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Seuil 2× habituel :</span>
                      <span className="font-mono text-rose-600 font-semibold">
                        {Number(sel.details.seuil_2x_habituel).toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  )}
                  {sel.details.solde != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Solde actuel :</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {Number(sel.details.solde).toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  )}
                  {sel.details.score != null && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Risk Score :</span>
                      <span className="font-bold text-indigo-600">{sel.details.score}/100</span>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-700">Connexions directes</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {connectedNodes.length} lien(s) financier(s) identifié(s)
                </p>
                {connectedNodes.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {connectedNodes.map((c, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-center justify-between">
                        <span>• {c.node?.label}</span>
                        {c.label && (
                          <span
                            className={cn(
                              "font-mono text-[11px]",
                              c.strong ? "font-bold text-rose-600" : "text-slate-500"
                            )}
                          >
                            {c.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={() => navigateTo("Client 360°")}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
              >
                Voir la fiche Client 360°
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Cliquez sur un nœud pour afficher ses flux et motifs d'alerte.</p>
          )}
        </div>
      </div>
    </div>
  )
}

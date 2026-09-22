"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
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
  Globe2,
  FileText,
  Image as ImageIcon,
  RotateCcw,
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
  client: { fill: "#6366F1", stroke: "#4F46E5", textColor: "#ffffff", r: 30 },
  compte: { fill: "#ffffff", stroke: "#CBD5E1", textColor: "#475569", r: 24 },
  beneficiaire: { fill: "#ffffff", stroke: "#CBD5E1", textColor: "#475569", r: 22 },
  alerte: { fill: "#FEE2E2", stroke: "#EF4444", textColor: "#991B1B", r: 22 },
}

const legend = [
  { label: "Client émetteur", color: "#6366F1" },
  { label: "Compte bancaire", color: "#CBD5E1" },
  { label: "Bénéficiaire régulier", color: "#94A3B8" },
  { label: "Alerte Rouge (≥ 15M / jour ou > 2× habituel)", color: "#EF4444" },
]

export function GraphView() {
  const [zoom, setZoom] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"client" | "global">("client")
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Clients & Sélection
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Données du graphe
  const [graphData, setGraphData] = useState<{ nodes: InternalNode[]; edges: InternalEdge[]; totalFlux: number; title: string }>({
    nodes: [],
    edges: [],
    totalFlux: 0,
    title: "",
  })

  // Fermer le menu d'export si clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 1. Charger la liste des clients
  useEffect(() => {
    clientService
      .getClients()
      .then((data) => {
        setClients(data)
        if (data.length > 0) {
          const preferred = data.find((c) => c.riskScore && c.riskScore >= 70) || data[0]
          setSelectedClient(preferred)
        }
      })
      .catch(() => {
        toast.error("Impossible de charger les clients")
      })
  }, [])

  // 2. Charger le graphe pour le client sélectionné
  const loadClientGraph = useCallback(async (client: Client) => {
    setLoading(true)
    try {
      const g = await graphService.getClientGraph(client.id)
      const internalNodes: InternalNode[] = g.noeuds.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type as any,
        x: n.x ?? 400,
        y: n.y ?? 260,
        alert: n.alert,
        details: n.details,
      }))

      const internalEdges: InternalEdge[] = g.liens.map((l) => ({
        from: l.from_node,
        to: l.to_node,
        label: l.label,
        strong: l.strong,
      }))

      setGraphData({
        nodes: internalNodes,
        edges: internalEdges,
        totalFlux: g.total_flux_detectes,
        title: g.client_nom || client.nom,
      })

      if (internalNodes.length > 0) {
        setSelected(internalNodes[0].id)
      }
    } catch (err) {
      console.error("Erreur graphe client :", err)
      toast.error("Erreur lors du calcul du graphe financier")
    } finally {
      setLoading(false)
    }
  }, [])

  // 3. Charger le graphe du réseau global
  const loadGlobalGraph = useCallback(async () => {
    setLoading(true)
    try {
      const g = await graphService.getGlobalGraph()
      const internalNodes: InternalNode[] = g.noeuds.map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type as any,
        x: n.x ?? 500,
        y: n.y ?? 350,
        alert: n.alert,
        details: n.details,
      }))

      const internalEdges: InternalEdge[] = g.liens.map((l) => ({
        from: l.from_node,
        to: l.to_node,
        label: l.label,
        strong: l.strong,
      }))

      setGraphData({
        nodes: internalNodes,
        edges: internalEdges,
        totalFlux: g.total_flux_detectes,
        title: "Cartographie Réseau Global LAKANA",
      })

      if (internalNodes.length > 0) {
        setSelected(internalNodes[0].id)
      }
    } catch (err) {
      console.error("Erreur graphe global :", err)
      toast.error("Erreur lors de la génération du graphe global")
    } finally {
      setLoading(false)
    }
  }, [])

  // Déclencher le chargement selon le mode
  useEffect(() => {
    if (viewMode === "global") {
      loadGlobalGraph()
    } else if (selectedClient) {
      loadClientGraph(selectedClient)
    }
  }, [viewMode, selectedClient, loadClientGraph, loadGlobalGraph])

  const nodes = graphData.nodes
  const edges = graphData.edges

  // Calcul dynamique de la boîte englobante (viewBox) pour que TOUS les nœuds soient visibles
  const dynamicViewBox = useMemo(() => {
    if (nodes.length === 0) return "0 0 800 560"
    const xs = nodes.map((n) => n.x)
    const ys = nodes.map((n) => n.y)
    const minX = Math.min(...xs) - 80
    const maxX = Math.max(...xs) + 80
    const minY = Math.min(...ys) - 70
    const maxY = Math.max(...ys) + 70

    const width = Math.max(800, maxX - minX)
    const height = Math.max(560, maxY - minY)
    return `${minX} ${minY} ${width} ${height}`
  }, [nodes])

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
    const matchComptes = c.comptes?.some((acc: any) =>
      (acc.numeroCompte || acc.numero_compte || "").toLowerCase().includes(q)
    )
    return Boolean(matchNom || matchPrenom || matchRaison || matchCode || matchCni || matchComptes)
  })

  // ----------------------------------------------------
  // FONCTIONS D'EXPORT : SVG corrigé, PNG & PDF
  // ----------------------------------------------------

  // 1. Export SVG propre avec namespace XML officiel
  const exportAsSvg = () => {
    const svg = svgRef.current
    if (!svg) return

    const serializer = new XMLSerializer()
    let source = serializer.serializeToString(svg)

    // Injection des namespaces XML indispensables pour que Chrome / Edge l'affichent en image et non en XML texte
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"')
    }

    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + source], {
      type: "image/svg+xml;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `graphe-${viewMode === "global" ? "reseau-global" : selectedClient?.codeClient || "flux"}.svg`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Fichier SVG téléchargé", { description: "Le graphe s'ouvre désormais en véritable image vectorielle." })
    setExportMenuOpen(false)
  }

  // 2. Export PNG haute résolution via HTML Canvas
  const exportAsPng = () => {
    const svg = svgRef.current
    if (!svg) return

    const serializer = new XMLSerializer()
    let source = serializer.serializeToString(svg)
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"')
    }

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()

    img.onload = () => {
      const vb = svg.viewBox.baseVal
      const width = vb.width > 0 ? vb.width * 1.5 : 1200
      const height = vb.height > 0 ? vb.height * 1.5 : 840

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const pngUrl = canvas.toDataURL("image/png")
        const a = document.createElement("a")
        a.href = pngUrl
        a.download = `graphe-${viewMode === "global" ? "reseau-global" : selectedClient?.codeClient || "flux"}.png`
        a.click()
        toast.success("Image PNG générée", { description: "Image haute définition téléchargée avec succès." })
      }
      URL.revokeObjectURL(url)
      setExportMenuOpen(false)
    }
    img.src = url
  }

  // 3. Export PDF complet d'investigation avec le graphe rendu
  const exportAsPdf = () => {
    const svg = svgRef.current
    if (!svg) return

    const serializer = new XMLSerializer()
    let svgString = serializer.serializeToString(svg)
    if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"')
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les popups.")
      return
    }

    const dateStr = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Rapport d'Investigation Financière — LAKANA</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .title { font-size: 20px; font-weight: 800; color: #1e1b4b; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 3px; }
          .badge {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
          }
          .graph-box {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #fafafa;
            padding: 10px;
            margin-bottom: 16px;
            page-break-inside: avoid;
            text-align: center;
          }
          .graph-box svg {
            max-width: 100%;
            height: auto;
            max-height: 460px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 16px;
          }
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
          }
          .summary-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
          .summary-val { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 6px 8px; border-bottom: 1px solid #cbd5e1; color: #475569; }
          td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
          .alert-row { background: #fef2f2; color: #991b1b; font-weight: 600; }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">🛡️ LAKANA — Graphe d'Investigation des Flux Financiers</div>
            <div class="subtitle">Conformité LBC/FT/FP • Dossier : ${graphData.title}</div>
          </div>
          <div class="badge">Édité le ${dateStr}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Cible d'analyse</div>
            <div class="summary-val">${graphData.title}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Flux Détectés</div>
            <div class="summary-val" style="color: #4f46e5;">${graphData.totalFlux.toLocaleString("fr-FR")} FCFA</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Nœuds Identifiés</div>
            <div class="summary-val">${nodes.length} entité(s)</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Alertes Rouges Actives</div>
            <div class="summary-val" style="color: #dc2626;">${nodes.filter((n) => n.alert).length} flux suspect(s)</div>
          </div>
        </div>

        <div class="graph-box">
          ${svgString}
        </div>

        <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-top: 12px;">
          Tableau des flux financiers et motifs de signalement :
        </div>
        <table>
          <thead>
            <tr>
              <th>Entité / Bénéficiaire</th>
              <th>Type</th>
              <th>Statut Risque</th>
              <th>Flux / Cumul Détecté</th>
              <th>Motif de coloration</th>
            </tr>
          </thead>
          <tbody>
            ${nodes
              .filter((n) => n.type !== "client")
              .map(
                (n) => `
              <tr class="${n.alert ? "alert-row" : ""}">
                <td><strong>${n.label}</strong></td>
                <td>${n.type}</td>
                <td>${n.alert ? "ALERTE ROUGE" : "Régulier"}</td>
                <td>${n.details?.cumul ? Number(n.details.cumul).toLocaleString("fr-FR") + " FCFA" : "—"}</td>
                <td>${n.details?.motif_alerte || (n.alert ? "Dépassement seuils 15M ou 2x habituel" : "Conforme")}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <span>LAKANA - Plateforme LBC/FT/FP conforme aux directives CENTIF / BCEAO</span>
          <span>Ce document constitue une pièce d'investigation confidentielle.</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    setExportMenuOpen(false)
    toast.success("Rapport PDF prêt", { description: "La boîte de dialogue d'enregistrement PDF s'est ouverte." })
  }

  return (
    <div className="space-y-5">
      {/* En-tête avec bascule Mode Client / Réseau Global et Exports */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] flex items-center gap-3">
            <Share2 className="w-7 h-7 text-indigo-600" />
            Graphe de relations financières
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cartographie des liens et flux suspects :{" "}
            <span className="font-semibold text-rose-600">
              Alerte rouge si ≥ 15M FCFA / jour ou flux &gt; 2× transactions habituelles.
            </span>
          </p>
        </div>

        {/* Contrôles & Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Onglets de Bascule : Client Spécifique vs Réseau Global */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1">
            <button
              onClick={() => setViewMode("client")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                viewMode === "client"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <User className="h-3.5 w-3.5" />
              Graphe Client
            </button>
            <button
              onClick={() => setViewMode("global")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                viewMode === "global"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Globe2 className="h-3.5 w-3.5" />
              Réseau Global (Tous les graphes)
            </button>
          </div>

          {/* Sélecteur de Client (actif en mode client) */}
          {viewMode === "client" && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                {selectedClient ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span className="max-w-[150px] truncate">
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
                <div className="absolute left-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in-50 duration-150">
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
          )}

          {/* Boutons Zoom & Centrage */}
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              title="Zoom arrière"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-xs font-semibold text-slate-500">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              title="Zoom avant"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowAllLabels((v) => !v)}
              className={cn(
                "flex h-8 items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold transition",
                showAllLabels
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
              title="Afficher ou masquer tous les libellés de montants sur les liens"
            >
              <span>{showAllLabels ? "Labels: Tous" : "Labels: Critiques"}</span>
            </button>
            <button
              onClick={() => setZoom(1)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              title="Réinitialiser le zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
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

          {/* Menu Déroulant d'Export : PDF, PNG & SVG */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Exporter le Graphe</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition", exportMenuOpen && "rotate-180")} />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in-50 duration-150 text-xs">
                <button
                  onClick={exportAsPdf}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <FileText className="h-4 w-4 text-rose-600" />
                  <div>
                    <p className="font-semibold">Rapport PDF Complet</p>
                    <p className="text-[11px] text-slate-400">Document imprimable avec graphe & flux</p>
                  </div>
                </button>

                <button
                  onClick={exportAsPng}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <ImageIcon className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold">Image PNG Haute Définition</p>
                    <p className="text-[11px] text-slate-400">Pour intégration dans vos documents</p>
                  </div>
                </button>

                <button
                  onClick={exportAsSvg}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                >
                  <Share2 className="h-4 w-4 text-indigo-600" />
                  <div>
                    <p className="font-semibold">Fichier SVG Vectoriel</p>
                    <p className="text-[11px] text-slate-400">Format XML standard valide pour navigateur</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bannière d'explication de la règle active */}
      <div className="bg-gradient-to-r from-indigo-50 via-rose-50 to-amber-50 rounded-2xl border border-indigo-100 p-4 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              Règle de Coloration Rouge Active (Conformité LAKANA / CENTIF) :
            </p>
            <p className="text-slate-500 mt-0.5">
              Un flux ou bénéficiaire passe en <span className="font-bold text-rose-600">ROUGE</span> si : (1) Le total
              des transactions journalières de l'individu atteint{" "}
              <span className="font-bold text-rose-600">15 000 000 FCFA</span> dans la journée, OU (2) Le montant dépasse{" "}
              <span className="font-bold text-rose-600">2× ses transactions habituelles</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700 font-semibold">
            {nodes.length} Nœuds
          </Badge>
          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-semibold">
            {nodes.filter((n) => n.alert).length} Alertes Rouges
          </Badge>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
            {graphData.totalFlux.toLocaleString("fr-FR")} FCFA Flux
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        {/* Canvas SVG du Graphe avec ViewBox Dynamique */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 xl:col-span-3">
          <div
            ref={canvasRef}
            className="relative h-[620px] w-full overflow-hidden rounded-lg bg-slate-50/70 border border-slate-100 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Calcul et génération des interconnexions financières...</span>
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 text-sm">
                <Share2 className="w-8 h-8 text-slate-300" />
                <span>Aucun flux enregistré pour cette sélection</span>
              </div>
            ) : (
              <svg
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                className="h-full w-full cursor-grab active:cursor-grabbing select-none"
                viewBox={dynamicViewBox}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.15s ease-out",
                }}
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
                        strokeWidth={e.strong ? 2.5 : 1.5}
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
                            fill="#ffffff"
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
                        {n.label.length > 16 ? `${n.label.slice(0, 14)}…` : n.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            )}

            {/* Légende en incrustation */}
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Share2 className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">Détail du nœud sélectionné</h3>
            </div>

            {sel ? (
              <div className="space-y-3">
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
                          ? "Score de risque élevé, cumul journalier ≥ 15M ou transaction > 2× l'habitude."
                          : "Flux suspect : seuil journalier de 15M atteint ou montant > 2× transactions habituelles.")}
                    </p>
                  </div>
                )}

                {/* Indicateurs financiers */}
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

                {/* Connexions directes */}
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-700">Connexions directes</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {connectedNodes.length} lien(s) financier(s) identifié(s)
                  </p>
                  {connectedNodes.length > 0 && (
                    <ul className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
                      {connectedNodes.map((c, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-center justify-between">
                          <span className="truncate max-w-[130px]">• {c.node?.label}</span>
                          {c.label && (
                            <span
                              className={cn(
                                "font-mono text-[11px] shrink-0",
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
              </div>
            ) : (
              <p className="text-sm text-slate-400">Cliquez sur un nœud pour afficher ses flux et motifs d'alerte.</p>
            )}
          </div>

          {selectedClient && viewMode === "client" && (
            <button
              onClick={() => {
                const targetId = selectedClient?.id || selectedClient?.codeClient
                if (targetId) {
                  try {
                    sessionStorage.setItem("lakana_selected_client_id", targetId)
                  } catch {}
                }
                navigateTo("Client 360°", targetId ? { clientId: targetId } : undefined)
              }}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
            >
              Fiche Client 360° ({selectedClient.nom})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

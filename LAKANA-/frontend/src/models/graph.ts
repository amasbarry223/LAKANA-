export interface GraphNode {
  id: string
  label: string
  type: "client" | "compte" | "beneficiaire" | "alerte" | string
  x?: number
  y?: number
  alert?: boolean
  details?: Record<string, any>
}

export interface GraphEdge {
  from_node: string
  to_node: string
  label?: string
  strong?: boolean
}

export interface FinancialGraph {
  client_id: string
  client_nom: string
  noeuds: GraphNode[]
  liens: GraphEdge[]
  total_flux_detectes: number
}

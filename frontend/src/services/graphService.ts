import { ApiClient } from "./apiClient"
import type { FinancialGraph } from "@/models/graph"

export const graphService = {
  async getClientGraph(clientId: string): Promise<FinancialGraph> {
    try {
      return await ApiClient.get<FinancialGraph>(`/graph/client/${clientId}`)
    } catch (e) {
      console.warn("API graph indisponible, fallback local:", e)
      return {
        client_id: clientId,
        client_nom: "Traoré Moussa",
        noeuds: [
          { id: "c1", label: "Traoré M.", type: "client", x: 400, y: 250, alert: true },
          { id: "a1", label: "Cpte 4821", type: "compte", x: 220, y: 140 },
          { id: "a2", label: "Cpte 7390", type: "compte", x: 580, y: 140 },
          { id: "b1", label: "Diallo F.", type: "beneficiaire", x: 120, y: 360, alert: true },
          { id: "b2", label: "Sow A.", type: "beneficiaire", x: 300, y: 400 },
          { id: "b3", label: "Camara K.", type: "beneficiaire", x: 500, y: 410, alert: true },
        ],
        liens: [
          { from_node: "c1", to_node: "a1" },
          { from_node: "c1", to_node: "a2" },
          { from_node: "a1", to_node: "b1", strong: true, label: "3,2M FCFA" },
          { from_node: "a1", to_node: "b2", label: "850k" },
          { from_node: "a2", to_node: "b3", strong: true, label: "4,1M FCFA" },
        ],
        total_flux_detectes: 8150000,
      }
    }
  },
}

import { ApiClient } from "./apiClient"
import type { Client } from "@/models/client"

function mapFromBackend(raw: any): Client {
  return {
    id: raw.id,
    codeClient: raw.code_client || raw.codeClient || "",
    nom: raw.nom || "",
    prenom: raw.prenom || "",
    dateNaissance: raw.date_naissance || raw.dateNaissance || "",
    profession: raw.profession || "",
    ville: raw.ville || "Bamako",
    pays: raw.pays || "Mali",
    telephone: raw.telephone || "",
    typeClient: raw.type_client || raw.typeClient || "Particulier",
    raisonSociale: raw.raison_sociale || raw.raisonSociale || "",
    formeJuridique: raw.forme_juridique || raw.formeJuridique || "",
    rccm: raw.rccm || "",
    nif: raw.nif || "",
    secteurActivite: raw.secteur_activite || raw.secteurActivite || "",
    beneficiaireEffectif: raw.beneficiaire_effectif || raw.beneficiaireEffectif || "",
    pieceIdentite: raw.piece_identite || raw.pieceIdentite || "",
    estPpe: Boolean(raw.est_ppe ?? raw.estPpe),
    fonctionPpe: raw.fonction_ppe || raw.fonctionPpe || "",
    typePpe: raw.type_ppe || raw.typePpe || "",
    paysMandat: raw.pays_mandat || raw.paysMandat || "",
    niveauRisque: raw.niveau_risque || raw.niveauRisque || "Faible",
    riskScore: raw.risk_score ?? raw.riskScore ?? 0,
    comptes: raw.comptes || [],
    createdAt: raw.created_at || raw.createdAt,
  }
}

function mapToBackend(client: Partial<Client>): any {
  return {
    code_client: client.codeClient || `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
    nom: client.nom,
    prenom: client.prenom,
    date_naissance: client.dateNaissance,
    profession: client.profession,
    ville: client.ville || "Bamako",
    pays: client.pays || "Mali",
    telephone: client.telephone,
    type_client: client.typeClient || "Particulier",
    raison_sociale: client.raisonSociale,
    forme_juridique: client.formeJuridique,
    rccm: client.rccm,
    nif: client.nif,
    secteur_activite: client.secteurActivite,
    beneficiaire_effectif: client.beneficiaireEffectif,
    piece_identite: client.pieceIdentite,
    est_ppe: Boolean(client.estPpe),
    fonction_ppe: client.fonctionPpe,
    type_ppe: client.typePpe,
    pays_mandat: client.paysMandat,
    niveau_risque: client.niveauRisque || (client.estPpe ? "Élevé" : "Faible"),
  }
}

export const clientService = {
  async getClients(query?: string): Promise<Client[]> {
    try {
      const raw = await ApiClient.get<any[]>("/clients", query ? { q: query } : undefined)
      return Array.isArray(raw) ? raw.map(mapFromBackend) : []
    } catch (e) {
      console.error("Erreur lors de la récupération des clients:", e)
      return []
    }
  },

  async getClientById(id: string): Promise<Client> {
    const raw = await ApiClient.get<any>(`/clients/${id}`)
    return mapFromBackend(raw)
  },

  async getClientScore(id: string): Promise<any> {
    return await ApiClient.get(`/clients/${id}/score`)
  },

  async createClient(payload: Partial<Client>): Promise<Client> {
    const body = mapToBackend(payload)
    const raw = await ApiClient.post<any>("/clients", body)
    return mapFromBackend(raw)
  },

  async updateClient(id: string, payload: Partial<Client>): Promise<Client> {
    const body = mapToBackend(payload)
    const raw = await ApiClient.put<any>(`/clients/${id}`, body)
    return mapFromBackend(raw)
  },

  async deleteClient(id: string): Promise<void> {
    await ApiClient.delete(`/clients/${id}`)
  },
}

import { ApiClient } from "./apiClient"

export type Role = "Analyste de conformité" | "Agent guichet"

export interface UserItem {
  id: string
  nomComplet: string
  email: string
  telephone?: string
  role: Role
  institution: string
  mfaEnabled: boolean
  isActive: boolean
  createdAt?: string
}

function mapFromBackend(raw: any): UserItem {
  return {
    id: raw.id,
    nomComplet: raw.nom_complet || raw.nomComplet || "",
    email: raw.email || "",
    telephone: raw.telephone || "",
    role: (raw.role?.toLowerCase().includes("guichet") ? "Agent guichet" : "Analyste de conformité") as Role,
    institution: raw.institution || "SFD Bamako",
    mfaEnabled: Boolean(raw.mfa_enabled ?? raw.mfaEnabled),
    isActive: Boolean(raw.is_active ?? raw.isActive ?? true),
    createdAt: raw.created_at || raw.createdAt,
  }
}

export const userService = {
  async getUsers(params?: { q?: string; role?: string }): Promise<UserItem[]> {
    try {
      const data = await ApiClient.get<any[]>("/users", params)
      return (data || []).map(mapFromBackend)
    } catch {
      return []
    }
  },

  async getComplianceOfficers(): Promise<UserItem[]> {
    try {
      const data = await ApiClient.get<any[]>("/users/compliance-officers")
      return (data || []).map(mapFromBackend)
    } catch {
      return []
    }
  },

  async createUser(data: {
    nom_complet: string
    email: string
    telephone?: string
    role: Role
    institution: string
    mfa_enabled?: boolean
    password?: string
  }): Promise<UserItem> {
    const raw = await ApiClient.post<any>("/users", data)
    return mapFromBackend(raw)
  },

  async updateUser(
    id: string,
    data: {
      nom_complet?: string
      email?: string
      telephone?: string
      role?: Role
      institution?: string
      mfa_enabled?: boolean
      is_active?: boolean
      password?: string
    }
  ): Promise<UserItem> {
    const raw = await ApiClient.put<any>(`/users/${id}`, data)
    return mapFromBackend(raw)
  },

  async toggleUserActive(id: string): Promise<{ success: boolean; is_active: boolean; message: string }> {
    return await ApiClient.delete<any>(`/users/${id}`)
  },
}

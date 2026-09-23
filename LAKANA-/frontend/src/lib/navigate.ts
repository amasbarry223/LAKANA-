"use client"

export type NavigateOptions = {
  clientId?: string
  alertRef?: string
  investigationRef?: string
}

export type NavigateDetail = {
  label: string
  options?: NavigateOptions
}

const aliasMap: Record<string, string> = {
  "Centre d'alertes": "Alertes & Détections",
  "Investigations": "Dossiers d'investigation",
  "Contrôle & Pré-filtrage Sociétaire": "Contrôle d'opération",
  "Transactions": "Contrôle d'opération",
  "Filtrage sanctions/PPE": "Vérification Sanctions & PPE",
  "Client 360°": "Fiches Sociétaires",
  "Consultation Réglementaire": "Assistant IA",
  "Guide Réglementaire LBC": "Assistant IA",
  "Assistant IA": "Assistant IA",
  "Utilisateurs & rôles": "Gestion des utilisateurs",
  "Rapports réglementaires": "Rapports CENTIF & États",
  "Journal d'audit": "Piste d'audit",
  "Intégration & Synchronisation": "Tableau de bord",
}

// Helper de navigation léger et unifié
export function navigateTo(label: string, options?: NavigateOptions) {
  if (typeof window !== "undefined") {
    const targetLabel = aliasMap[label] || label
    const detail: NavigateDetail = options ? { label: targetLabel, options } : { label: targetLabel }
    window.dispatchEvent(new CustomEvent("lakana-navigate", { detail }))
  }
}

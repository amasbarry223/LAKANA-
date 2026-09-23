export type NewInvestigationPrefill = {
  alertRef?: string
  client?: string
  type?: string
  score?: number
}

export const INVESTIGATION_TYPES = [
  "Fractionnement",
  "Correspondance PPE",
  "Volume inhabituel",
  "Fréquence anormale",
  "Relations inhabituelles",
  "Comportement atypique",
  "Signalement manuel",
] as const

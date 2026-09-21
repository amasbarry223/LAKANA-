import type { AlertItem } from "@/lib/dashboard-context"

export type NewInvestigationPrefill = {
  alertRef?: string
  client?: string
  type?: string
  score?: number
}

export const MOCK_ALERTS: AlertItem[] = [
  {
    ref: "ALR-241",
    client: "Traoré, Moussa",
    clientId: "CLI-1042",
    score: 87,
    type: "Fractionnement",
    level: "bloquante",
    module: "Fractionnement",
    analyste: "A. Touré",
  },
  {
    ref: "ALR-238",
    client: "Diarra, Fatoumata",
    clientId: "CLI-1087",
    score: 72,
    type: "Correspondance PPE",
    level: "bloquante",
    module: "Filtrage sanctions",
    analyste: "A. Touré",
  },
  {
    ref: "ALR-235",
    client: "Keïta, Ibrahim",
    clientId: "CLI-1103",
    score: 64,
    type: "Volume inhabituel",
    level: "analyser",
    module: "Risk Score",
    analyste: "M. Diallo",
  },
  {
    ref: "ALR-229",
    client: "Coulibaly, Aïssata",
    clientId: "CLI-1066",
    score: 58,
    type: "Fréquence anormale",
    level: "analyser",
    module: "Comportementale",
    analyste: "A. Touré",
  },
  {
    ref: "ALR-225",
    client: "Touré, Seydou",
    clientId: "CLI-1055",
    score: 41,
    type: "Relations inhabituelles",
    level: "informative",
    module: "Risk Score",
    analyste: "F. Koné",
  },
  {
    ref: "ALR-219",
    client: "Sangaré, Mariam",
    clientId: "CLI-1098",
    score: 36,
    type: "Comportement atypique",
    level: "informative",
    module: "Comportementale",
    analyste: "M. Diallo",
  },
]

export const INVESTIGATION_TYPES = [
  "Fractionnement",
  "Correspondance PPE",
  "Volume inhabituel",
  "Fréquence anormale",
  "Relations inhabituelles",
  "Comportement atypique",
  "Signalement manuel",
] as const

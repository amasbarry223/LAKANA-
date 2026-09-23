export type InvestigationStatus = "en_cours" | "cloturee" | "transmise"

export interface Investigation {
  ref: string
  client: string
  alertRef?: string
  type: string
  analyste: string
  status: InvestigationStatus
  dateOuverture: string
  dateCloture?: string
  decision?: string
  notes: number
  pieces: number
  score: number
  journalNotes?: string
}

export interface InvestigationDecisionPayload {
  status: "cloturee" | "transmise"
  decision: string // Décision motivée obligatoire (INV-02)
}

export type AlertLevel = "bloquante" | "analyser" | "informative"
export type AlertStatus = "nouvelle" | "en_cours" | "cloturee" | "classee"

export interface Alert {
  id: string
  ref: string
  clientId: string
  client: string
  score: number
  type: string
  level: AlertLevel
  module: string
  facteurs: string[]
  status: AlertStatus
  analyste: string
  createdAt?: string
}

export interface AlertFilter {
  status?: string
  level?: string
  module?: string
  analyste?: string
}

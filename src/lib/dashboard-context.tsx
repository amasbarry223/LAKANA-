"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { NewInvestigationPrefill } from "@/lib/alerts-data"

export type InvestigationStatus = "en_cours" | "cloturee" | "transmise"

export type Investigation = {
  ref: string
  client: string
  alertRef: string
  type: string
  analyste: string
  status: InvestigationStatus
  dateOuverture: string
  dateCloture?: string
  decision?: string
  notes: number
  pieces: number
  score: number
}

export type ImportItem = {
  id: string
  source: string
  type: "API" | "CSV" | "Excel" | "Synchronisation"
  date: string
  records: number
  status: "Validé" | "Erreurs" | "En file"
  doublons?: number
  incoherences?: number
}

export type AlertLevel = "bloquante" | "analyser" | "informative"

export type AlertItem = {
  ref: string
  client: string
  clientId: string
  score: number
  type: string
  level: AlertLevel
  module: string
  analyste: string
}

export type FilterState = {
  status: string
  level: string
  module: string
  analyste: string
}

export type SettingsState = {
  institution: string
  devise: string
  langue: string
  weights: number[]
  thresholds: number[]
  mfa: boolean
  autoLock: boolean
}

export type NavigateOptions = {
  clientId?: string
  alertRef?: string
  investigationRef?: string
}

const INITIAL_INVESTIGATIONS: Investigation[] = [
  { ref: "INV-241", client: "Traoré, Moussa", alertRef: "ALR-241", type: "Fractionnement", analyste: "A. Touré", status: "en_cours", dateOuverture: "25/08/2026", notes: 4, pieces: 2, score: 87 },
  { ref: "INV-238", client: "Diarra, Fatoumata", alertRef: "ALR-238", type: "Correspondance PPE", analyste: "A. Touré", status: "en_cours", dateOuverture: "24/08/2026", notes: 2, pieces: 1, score: 72 },
  { ref: "INV-235", client: "Keïta, Ibrahim", alertRef: "ALR-235", type: "Volume inhabituel", analyste: "M. Diallo", status: "en_cours", dateOuverture: "23/08/2026", notes: 1, pieces: 0, score: 64 },
  { ref: "INV-229", client: "Coulibaly, Aïssata", alertRef: "ALR-229", type: "Fréquence anormale", analyste: "A. Touré", status: "cloturee", dateOuverture: "20/08/2026", dateCloture: "22/08/2026", decision: "Classée sans suite — activité justifiée", notes: 5, pieces: 3, score: 58 },
  { ref: "INV-219", client: "Touré, Seydou", alertRef: "ALR-219", type: "Relations inhabituelles", analyste: "M. Diallo", status: "transmise", dateOuverture: "15/08/2026", dateCloture: "21/08/2026", decision: "Déclaration de soupçon transmise au CENTIF", notes: 7, pieces: 5, score: 81 },
  { ref: "INV-156", client: "Sangaré, Mariam", alertRef: "ALR-156", type: "Comportement atypique", analyste: "A. Touré", status: "cloturee", dateOuverture: "02/08/2026", dateCloture: "10/08/2026", decision: "Classée — faux positif documenté", notes: 3, pieces: 1, score: 36 },
]

const INITIAL_IMPORTS: ImportItem[] = [
  { id: "INT-1042", source: "SFD Bamako — API", type: "API", date: "25/08/2026 14:30", records: 12847, status: "Validé" },
  { id: "INT-1041", source: "SFD Sikasso — API", type: "API", date: "25/08/2026 12:15", records: 5421, status: "Validé" },
  { id: "INT-1040", source: "SFD Kayes — fichier CSV", type: "CSV", date: "25/08/2026 09:00", records: 3120, status: "Erreurs", doublons: 12, incoherences: 3 },
  { id: "INT-1039", source: "Import Excel — Clients CIF", type: "Excel", date: "24/08/2026 16:45", records: 856, status: "Validé" },
  { id: "INT-1038", source: "SFD Bamako — API", type: "API", date: "24/08/2026 14:30", records: 11203, status: "Validé" },
  { id: "INT-1037", source: "Synchronisation différée — Kayes", type: "Synchronisation", date: "24/08/2026 06:00", records: 2044, status: "Validé" },
  { id: "INT-1036", source: "SFD Sikasso — fichier CSV", type: "CSV", date: "23/08/2026 11:20", records: 2890, status: "Erreurs", doublons: 5, incoherences: 1 },
  { id: "INT-1035", source: "Import Excel — Transactions T2", type: "Excel", date: "22/08/2026 10:00", records: 15640, status: "En file" },
]

export const DEFAULT_FILTERS: FilterState = {
  status: "Tous statuts",
  level: "Tous niveaux",
  module: "Tous modules",
  analyste: "Tous analystes",
}

const DEFAULT_SETTINGS: SettingsState = {
  institution: "SFD Bamako",
  devise: "FCFA (XOF)",
  langue: "Français",
  weights: [30, 25, 20, 15, 10],
  thresholds: [1000000, 950000, 48, 24, 5, 30],
  mfa: true,
  autoLock: true,
}

type DashboardContextValue = {
  online: boolean
  setOnline: (v: boolean) => void
  dateRange: string
  setDateRange: (v: string) => void
  dateRangeLabel: string
  filters: FilterState
  setFilters: (v: FilterState) => void
  compareMode: boolean
  setCompareMode: (v: boolean) => void
  alertsView: "grid" | "list"
  setAlertsView: (v: "grid" | "list") => void
  investigations: Investigation[]
  setInvestigations: React.Dispatch<React.SetStateAction<Investigation[]>>
  addInvestigation: (overrides?: Partial<Omit<Investigation, "ref">>) => string
  imports: ImportItem[]
  setImports: React.Dispatch<React.SetStateAction<ImportItem[]>>
  addImport: (item: Omit<ImportItem, "id" | "date"> & { source: string }) => void
  selectedClientId: string | null
  setSelectedClientId: (id: string | null) => void
  selectedInvestigationRef: string | null
  setSelectedInvestigationRef: (ref: string | null) => void
  settings: SettingsState
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>
  saveSettings: () => void
  userName: string
  userRole: string
  navigatePayload: NavigateOptions
  setNavigatePayload: (payload: NavigateOptions) => void
  newInvestigationOpen: boolean
  newInvestigationPrefill: NewInvestigationPrefill | null
  openNewInvestigation: (prefill?: NewInvestigationPrefill) => void
  closeNewInvestigation: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

const DATE_LABELS: Record<string, string> = {
  "Aujourd'hui": "21 août 2026",
  "7 derniers jours": "14 - 21 août 2026",
  "30 derniers jours": "22 juil. - 21 août 2026",
  "Ce trimestre": "Avril - Août 2026",
  Personnalisé: "19 - 25 août 2026",
}

function loadSettings(): SettingsState {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem("lakana-settings")
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS
}

export function DashboardProvider({
  children,
  userName,
  userRole,
}: {
  children: ReactNode
  userName: string
  userRole: string
}) {
  const [online, setOnline] = useState(true)
  const [dateRange, setDateRange] = useState("7 derniers jours")
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [compareMode, setCompareMode] = useState(false)
  const [alertsView, setAlertsView] = useState<"grid" | "list">("grid")
  const [investigations, setInvestigations] = useState<Investigation[]>(INITIAL_INVESTIGATIONS)
  const [imports, setImports] = useState<ImportItem[]>(INITIAL_IMPORTS)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedInvestigationRef, setSelectedInvestigationRef] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [navigatePayload, setNavigatePayload] = useState<NavigateOptions>({})
  const [newInvestigationOpen, setNewInvestigationOpen] = useState(false)
  const [newInvestigationPrefill, setNewInvestigationPrefill] = useState<NewInvestigationPrefill | null>(null)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const openNewInvestigation = useCallback((prefill?: NewInvestigationPrefill) => {
    setNewInvestigationPrefill(prefill ?? null)
    setNewInvestigationOpen(true)
  }, [])

  const closeNewInvestigation = useCallback(() => {
    setNewInvestigationOpen(false)
    setNewInvestigationPrefill(null)
  }, [])

  const addInvestigation = useCallback((overrides?: Partial<Omit<Investigation, "ref">>) => {
    const maxNum = investigations.reduce((max, inv) => {
      const n = parseInt(inv.ref.replace("INV-", ""), 10)
      return Number.isNaN(n) ? max : Math.max(max, n)
    }, 245)
    const ref = `INV-${maxNum + 1}`
    const today = new Date().toLocaleDateString("fr-FR")
    const initials = userName.split(" ").map((p) => p[0] + ".").slice(0, 2).join(" ").replace(". ", ". ").trim() || "A. Touré"
    const newInv: Investigation = {
      ref,
      client: overrides?.client ?? "Nouveau dossier",
      alertRef: overrides?.alertRef ?? "—",
      type: overrides?.type ?? "À documenter",
      analyste: overrides?.analyste ?? initials,
      status: overrides?.status ?? "en_cours",
      dateOuverture: overrides?.dateOuverture ?? today,
      dateCloture: overrides?.dateCloture,
      decision: overrides?.decision,
      notes: overrides?.notes ?? 0,
      pieces: overrides?.pieces ?? 0,
      score: overrides?.score ?? 0,
    }
    setInvestigations((arr) => [newInv, ...arr])
    setSelectedInvestigationRef(ref)
    return ref
  }, [investigations, userName])

  const addImport = useCallback((item: Omit<ImportItem, "id" | "date"> & { source: string }) => {
    const id = `INT-${1043 + imports.length}`
    const now = new Date()
    const date = now.toLocaleDateString("fr-FR") + " " + now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    setImports((arr) => [{ ...item, id, date }, ...arr])
  }, [imports.length])

  const saveSettings = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lakana-settings", JSON.stringify(settings))
    }
  }, [settings])

  const value = useMemo(
    () => ({
      online,
      setOnline,
      dateRange,
      setDateRange,
      dateRangeLabel: DATE_LABELS[dateRange] ?? DATE_LABELS["7 derniers jours"],
      filters,
      setFilters,
      compareMode,
      setCompareMode,
      alertsView,
      setAlertsView,
      investigations,
      setInvestigations,
      addInvestigation,
      imports,
      setImports,
      addImport,
      selectedClientId,
      setSelectedClientId,
      selectedInvestigationRef,
      setSelectedInvestigationRef,
      settings,
      setSettings,
      saveSettings,
      userName,
      userRole,
      navigatePayload,
      setNavigatePayload,
      newInvestigationOpen,
      newInvestigationPrefill,
      openNewInvestigation,
      closeNewInvestigation,
    }),
    [
      online,
      dateRange,
      filters,
      compareMode,
      alertsView,
      investigations,
      addInvestigation,
      imports,
      addImport,
      selectedClientId,
      selectedInvestigationRef,
      settings,
      saveSettings,
      userName,
      userRole,
      navigatePayload,
      newInvestigationOpen,
      newInvestigationPrefill,
      openNewInvestigation,
      closeNewInvestigation,
    ]
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}

export function useDashboardOptional() {
  return useContext(DashboardContext)
}

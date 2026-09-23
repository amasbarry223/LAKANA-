"use client"

import { useEffect, useState } from "react"
import {
  LayoutGrid,
  BellRing,
  UserRound,
  Share2,
  FolderSearch,
  Sparkles,
  ShieldAlert,
  ArrowRightLeft,
  UserPlus,
  Database,
  Users,
  ScrollText,
  FileBarChart,
  Settings,
  RefreshCw,
  Plus,
  Download,
  Moon,
  LogOut,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

type Command = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onSelect: () => void
  shortcut?: string
  keywords?: string
}

const navCommands = [
  { label: "Tableau de bord", icon: LayoutGrid, keywords: "overview accueil home pilotage" },
  { label: "Centre d'alertes", icon: BellRing, keywords: "alertes alr urgences" },
  { label: "Filtrage sanctions/PPE", icon: ShieldAlert, keywords: "sanctions ppe flt screening onu uemoa" },
  { label: "Transactions", icon: ArrowRightLeft, keywords: "simulateur flux cash transaction test" },
  { label: "Investigations", icon: FolderSearch, keywords: "dossiers inv enquetes dos" },
  { label: "Clients & Enrôlement", icon: UserPlus, keywords: "clients membres enrolement onboarding kyc" },
  { label: "Client 360°", icon: UserRound, keywords: "client fiche profil score risque comportement" },
  { label: "Graphe de relations", icon: Share2, keywords: "graphe reseau graph liens beneficiaire" },
  { label: "Assistant IA", icon: Sparkles, keywords: "ia chat assistant llm synthese" },
  { label: "Rapports réglementaires", icon: FileBarChart, keywords: "rapports reports bceao centif str" },
  { label: "Journal d'audit", icon: ScrollText, keywords: "audit log tracabilite sha256" },
  { label: "Intégration & Synchronisation", icon: Database, keywords: "import ingestion sfd connecteurs sync hors ligne offline" },
  { label: "Utilisateurs & rôles", icon: Users, keywords: "users rbac bo profils habilitations" },
  { label: "Paramètres", icon: Settings, keywords: "settings config seuils alertes" },
]

// Données clients/alertes pour la recherche
const searchableClients = [
  { name: "Traoré, Moussa", id: "CLI-1042", type: "Client", score: 87 },
  { name: "Diarra, Fatoumata", id: "CLI-1087", type: "Client", score: 72 },
  { name: "Keïta, Ibrahim", id: "CLI-1103", type: "Client", score: 64 },
  { name: "Coulibaly, Aïssata", id: "CLI-1066", type: "Client", score: 58 },
  { name: "Touré, Seydou", id: "CLI-1055", type: "Client", score: 41 },
  { name: "Sangaré, Mariam", id: "CLI-1098", type: "Client", score: 36 },
]

const searchableAlerts = [
  { name: "ALR-241 — Fractionnement (Traoré M.)", id: "ALR-241", type: "Alerte", clientId: "CLI-1042" },
  { name: "ALR-238 — Correspondance PPE (Diarra F.)", id: "ALR-238", type: "Alerte", clientId: "CLI-1087" },
  { name: "ALR-235 — Volume inhabituel (Keïta I.)", id: "ALR-235", type: "Alerte", clientId: "CLI-1103" },
  { name: "INV-241 — Investigation Traoré", id: "INV-241", type: "Investigation" },
  { name: "INV-238 — Investigation Diarra", id: "INV-238", type: "Investigation" },
]

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onAction,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onNavigate: (label: string, options?: { clientId?: string; alertRef?: string; investigationRef?: string }) => void
  onAction: (action: string) => void
}) {
  const handleNav = (label: string, options?: { clientId?: string; alertRef?: string; investigationRef?: string }) => {
    onNavigate(label, options)
    onOpenChange(false)
  }

  const handleAction = (action: string) => {
    onAction(action)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une page, un client, une alerte, ou une action..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

        {/* Actions rapides */}
        <CommandGroup heading="Actions rapides">
          <CommandItem onSelect={() => handleAction("new-investigation")}>
            <Plus className="h-4 w-4" />
            Nouvelle investigation
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleAction("export-audit")}>
            <Download className="h-4 w-4" />
            Exporter le journal d'audit (CSV)
          </CommandItem>
          <CommandItem onSelect={() => handleAction("toggle-theme")}>
            <Moon className="h-4 w-4" />
            Basculer mode sombre / clair
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleAction("sync")}>
            <RefreshCw className="h-4 w-4" />
            Synchroniser maintenant
          </CommandItem>
          <CommandItem onSelect={() => handleAction("logout")}>
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {navCommands.map((c) => (
            <CommandItem
              key={c.label}
              value={`${c.label} ${c.keywords ?? ""}`}
              onSelect={() => handleNav(c.label)}
            >
              <c.icon className="h-4 w-4" />
              {c.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Clients */}
        <CommandGroup heading="Clients">
          {searchableClients.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${c.id} client`}
              onSelect={() => handleNav("Client 360°", { clientId: c.id })}
            >
              <UserRound className="h-4 w-4" />
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-slate-400">{c.id} · {c.score}/100</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Alertes & Investigations */}
        <CommandGroup heading="Alertes & Investigations">
          {searchableAlerts.map((a) => (
            <CommandItem
              key={a.id}
              value={`${a.name} ${a.id}`}
              onSelect={() =>
                handleNav(
                  a.type === "Investigation" ? "Investigations" : "Centre d'alertes",
                  a.type === "Investigation"
                    ? { investigationRef: a.id }
                    : { alertRef: a.id, clientId: "clientId" in a ? a.clientId : undefined }
                )
              }
            >
              <BellRing className="h-4 w-4" />
              <span className="flex-1">{a.name}</span>
              <span className="text-xs text-slate-400">{a.type}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

// Hook pour le raccourci clavier ⌘K / Ctrl+K
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return { open, setOpen }
}

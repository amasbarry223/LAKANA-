"use client"

import {
  LayoutGrid,
  BellRing,
  UserRound,
  Share2,
  FolderSearch,
  Sparkles,
  ShieldAlert,
  Gauge,
  Activity,
  Split,
  Users,
  ScrollText,
  FileBarChart,
  Database,
  Settings,
  RefreshCw,
  Bell,
  Search,
} from "lucide-react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import { toast } from "sonner"

type CmdItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  hint?: string
}

export function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onNavigate: (view: string) => void
}) {
  const navItems: CmdItem[] = [
    { label: "Tableau de bord", icon: LayoutGrid, hint: "Vue d'ensemble", action: () => onNavigate("Tableau de bord") },
    { label: "Centre d'alertes", icon: BellRing, hint: "Analyse", action: () => onNavigate("Centre d'alertes") },
    { label: "Client 360°", icon: UserRound, hint: "Analyse", action: () => onNavigate("Client 360°") },
    { label: "Graphe de relations", icon: Share2, hint: "Analyse", action: () => onNavigate("Graphe de relations") },
    { label: "Investigations", icon: FolderSearch, hint: "Analyse", action: () => onNavigate("Investigations") },
    { label: "Assistant IA", icon: Sparkles, hint: "Analyse", action: () => onNavigate("Assistant IA") },
    { label: "Filtrage sanctions/PPE", icon: ShieldAlert, hint: "Conformité", action: () => onNavigate("Filtrage sanctions/PPE") },
    { label: "Risk Score", icon: Gauge, hint: "Conformité", action: () => onNavigate("Risk Score") },
    { label: "Détection comportementale", icon: Activity, hint: "Conformité", action: () => onNavigate("Détection comportementale") },
    { label: "Fractionnement", icon: Split, hint: "Conformité", action: () => onNavigate("Fractionnement") },
    { label: "Intégration des données", icon: Database, hint: "Administration", action: () => onNavigate("Intégration des données") },
    { label: "Utilisateurs & rôles", icon: Users, hint: "Administration", action: () => onNavigate("Utilisateurs & rôles") },
    { label: "Journal d'audit", icon: ScrollText, hint: "Administration", action: () => onNavigate("Journal d'audit") },
    { label: "Rapports réglementaires", icon: FileBarChart, hint: "Administration", action: () => onNavigate("Rapports réglementaires") },
    { label: "Paramètres", icon: Settings, hint: "Paramètres", action: () => onNavigate("Paramètres") },
    { label: "Synchronisation", icon: RefreshCw, hint: "Paramètres", action: () => onNavigate("Synchronisation") },
    { label: "Notifications", icon: Bell, hint: "Paramètres", action: () => onNavigate("Notifications") },
  ]

  const clients: CmdItem[] = [
    { label: "Traoré, Moussa", icon: UserRound, hint: "CLI-1042 · score 87", action: () => { onNavigate("Client 360°"); toast.info("Client ouvert", { description: "Traoré, Moussa (CLI-1042) — score 87/100." }) } },
    { label: "Diarra, Fatoumata", icon: UserRound, hint: "CLI-1087 · PPE", action: () => { onNavigate("Client 360°"); toast.info("Client ouvert", { description: "Diarra, Fatoumata (CLI-1087) — PPE." }) } },
    { label: "Keïta, Ibrahim", icon: UserRound, hint: "CLI-1103 · score 64", action: () => { onNavigate("Client 360°"); toast.info("Client ouvert", { description: "Keïta, Ibrahim (CLI-1103) — score 64/100." }) } },
  ]

  const alerts: CmdItem[] = [
    { label: "ALR-241 · Fractionnement", icon: BellRing, hint: "Bloquante", action: () => { onNavigate("Centre d'alertes"); toast.info("Alerte ouverte", { description: "ALR-241 — Traoré M. — Fractionnement." }) } },
    { label: "ALR-238 · Correspondance PPE", icon: BellRing, hint: "Bloquante", action: () => { onNavigate("Centre d'alertes"); toast.info("Alerte ouverte", { description: "ALR-238 — Diarra F. — PPE." }) } },
    { label: "INV-241 · Investigation en cours", icon: FolderSearch, hint: "Traoré M.", action: () => { onNavigate("Investigations"); toast.info("Dossier ouvert", { description: "INV-241 — Traoré M." }) } },
  ]

  const run = (item: CmdItem) => {
    item.action()
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-xl">
      <CommandInput placeholder="Rechercher une page, un client, une alerte..." />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem key={item.label} value={`${item.label} ${item.hint ?? ""}`} onSelect={() => run(item)}>
              <item.icon className="h-4 w-4 text-slate-400" />
              <span>{item.label}</span>
              {item.hint && <span className="ml-auto text-[11px] text-slate-400">{item.hint}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Clients">
          {clients.map((item) => (
            <CommandItem key={item.label} value={`client ${item.label} ${item.hint ?? ""}`} onSelect={() => run(item)}>
              <item.icon className="h-4 w-4 text-slate-400" />
              <span>{item.label}</span>
              {item.hint && <span className="ml-auto text-[11px] text-slate-400">{item.hint}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Alertes & investigations">
          {alerts.map((item) => (
            <CommandItem key={item.label} value={`alerte ${item.label} ${item.hint ?? ""}`} onSelect={() => run(item)}>
              <item.icon className="h-4 w-4 text-slate-400" />
              <span>{item.label}</span>
              {item.hint && <span className="ml-auto text-[11px] text-slate-400">{item.hint}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

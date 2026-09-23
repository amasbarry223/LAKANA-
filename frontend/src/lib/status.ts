import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
  Archive,
  Send,
  type LucideIcon,
} from "lucide-react"
import type { badgeVariants } from "@/components/ui/badge"
import type { VariantProps } from "class-variance-authority"

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

export interface StatusPresentation {
  label: string
  variant: BadgeVariant
  Icon: LucideIcon
}

/**
 * Correspondance domaine → présentation pour les 4 énums réels du backend.
 * Palette fixe à 5 familles (voir badge.tsx) : un statut = une couleur, partout.
 */

export const alertNiveau: Record<"bloquante" | "analyser" | "informative", StatusPresentation> = {
  bloquante: { label: "Bloquante", variant: "danger", Icon: ShieldAlert },
  analyser: { label: "À analyser", variant: "warning", Icon: AlertTriangle },
  informative: { label: "Informative", variant: "success", Icon: Info },
}

export const alertStatut: Record<"nouvelle" | "en_cours" | "cloturee" | "classee", StatusPresentation> = {
  nouvelle: { label: "Nouvelle", variant: "brand", Icon: Clock },
  en_cours: { label: "En cours", variant: "warning", Icon: AlertTriangle },
  cloturee: { label: "Clôturée", variant: "success", Icon: CheckCircle2 },
  classee: { label: "Classée", variant: "neutral", Icon: Archive },
}

export const clientNiveauRisque: Record<"Élevé" | "Moyen" | "Faible", StatusPresentation> = {
  Élevé: { label: "Élevé", variant: "danger", Icon: ShieldAlert },
  Moyen: { label: "Moyen", variant: "warning", Icon: AlertTriangle },
  Faible: { label: "Faible", variant: "success", Icon: CheckCircle2 },
}

export const investigationStatus: Record<"en_cours" | "cloturee" | "transmise", StatusPresentation> = {
  en_cours: { label: "En cours", variant: "warning", Icon: Clock },
  cloturee: { label: "Classée", variant: "success", Icon: CheckCircle2 },
  transmise: { label: "Transmise", variant: "danger", Icon: Send },
}

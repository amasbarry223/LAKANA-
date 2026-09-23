"use client"

import { useEffect } from "react"
import { X, User, FolderSearch, BellRing } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, formatFacteur } from "@/lib/utils"
import { navigateTo } from "@/lib/navigate"
import { useDashboard, type AlertItem } from "@/lib/dashboard-context"

const levelLabel: Record<AlertItem["level"], string> = {
  bloquante: "Bloquante",
  analyser: "À analyser",
  informative: "Informative",
}

const levelColor: Record<AlertItem["level"], string> = {
  bloquante: "bg-rose-50 text-rose-700 border-rose-200",
  analyser: "bg-amber-50 text-amber-700 border-amber-200",
  informative: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

type AlertDetailModalProps = {
  alert: AlertItem
  onClose: () => void
}

export function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  const { investigations, openNewInvestigation } = useDashboard()

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const openInvestigation = () => {
    const existing = investigations.find(
      (i) => i.alertRef === alert.ref && i.status === "en_cours"
    )
    if (existing) {
      navigateTo("Investigations", { investigationRef: existing.ref })
    } else {
      openNewInvestigation({
        alertRef: alert.ref,
        client: alert.client,
        type: alert.type,
        score: alert.score,
      })
      navigateTo("Investigations")
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
        aria-describedby="alert-modal-desc"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 id="alert-modal-title" className="text-lg font-semibold text-slate-900">Détail de l'alerte</h3>
            <p id="alert-modal-desc" className="mt-0.5 text-xs text-slate-400">{alert.ref} : {alert.client}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("border", levelColor[alert.level])}>
              {levelLabel[alert.level]}
            </Badge>
            <span className="text-sm font-semibold text-indigo-600">{alert.score}/100</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Type</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{alert.type}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Module</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{alert.module}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Analyste assigné</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{alert.analyste}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Client</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{alert.client}</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Facteurs déclencheurs réels</p>
            {alert.facteurs && alert.facteurs.length > 0 ? (
              <ul className="mt-2 space-y-2 text-sm">
                {alert.facteurs.map((facteur, idx) => (
                  <li key={idx} className="flex items-start gap-2 rounded bg-slate-50 p-2 text-xs text-slate-700">
                    <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                    <span>{formatFacteur(facteur)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-500">
                Aucun facteur spécifique supplémentaire rapporté par le moteur de détection.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => {
              navigateTo("Client 360°", { clientId: alert.clientId })
              onClose()
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <User className="h-3.5 w-3.5" />
            Client 360°
          </button>
          <button
            onClick={openInvestigation}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <FolderSearch className="h-3.5 w-3.5" />
            Ouvrir investigation
          </button>
          <button
            onClick={() => {
              navigateTo("Centre d'alertes")
              onClose()
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <BellRing className="h-3.5 w-3.5" />
            Centre d'alertes
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { X, FolderSearch, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/dashboard-context"
import { MOCK_ALERTS, INVESTIGATION_TYPES, type NewInvestigationPrefill } from "@/lib/alerts-data"
import { navigateTo } from "@/lib/navigate"

type SourceMode = "alerte" | "signalement"

export function NewInvestigationModal({
  open,
  onClose,
  prefill,
}: {
  open: boolean
  onClose: () => void
  prefill?: NewInvestigationPrefill | null
}) {
  const { addInvestigation, investigations } = useDashboard()
  const [source, setSource] = useState<SourceMode>("alerte")
  const [alertRef, setAlertRef] = useState("")
  const [client, setClient] = useState("")
  const [type, setType] = useState<string>(INVESTIGATION_TYPES[0])
  const [motivation, setMotivation] = useState("")

  const selectedAlert = MOCK_ALERTS.find((a) => a.ref === alertRef)

  useEffect(() => {
    if (!open) return
    const withoutInv = MOCK_ALERTS.filter(
      (a) => !investigations.some((i) => i.alertRef === a.ref && i.status === "en_cours")
    )
    if (prefill?.alertRef) {
      setSource("alerte")
      setAlertRef(prefill.alertRef)
      const alert = MOCK_ALERTS.find((a) => a.ref === prefill.alertRef)
      setClient(prefill.client ?? alert?.client ?? "")
      setType(prefill.type ?? alert?.type ?? INVESTIGATION_TYPES[0])
    } else if (prefill?.client) {
      setSource("signalement")
      setClient(prefill.client)
      setType(prefill.type ?? "Signalement manuel")
      setAlertRef("")
    } else {
      setSource("alerte")
      setAlertRef(withoutInv[0]?.ref ?? MOCK_ALERTS[0]?.ref ?? "")
      setClient(withoutInv[0]?.client ?? "")
      setType(withoutInv[0]?.type ?? INVESTIGATION_TYPES[0])
    }
    setMotivation("")
  }, [open, prefill, investigations])

  useEffect(() => {
    if (source === "alerte" && selectedAlert) {
      setClient(selectedAlert.client)
      setType(selectedAlert.type)
    }
  }, [source, selectedAlert])

  if (!open) return null

  const existingInv = alertRef
    ? investigations.find((i) => i.alertRef === alertRef && i.status === "en_cours")
    : null

  const submit = () => {
    if (existingInv) {
      toast.info("Dossier existant", {
        description: `${existingInv.ref} est déjà ouvert pour cette alerte.`,
      })
      navigateTo("Investigations", { investigationRef: existingInv.ref })
      onClose()
      return
    }

    if (!client.trim()) {
      toast.error("Client requis", { description: "Sélectionnez un client ou une alerte (INV-01)." })
      return
    }

    const ref = addInvestigation({
      client: client.trim(),
      alertRef: source === "alerte" && alertRef ? alertRef : "—",
      type,
      score: selectedAlert?.score ?? prefill?.score ?? 0,
      notes: motivation.trim() ? 1 : 0,
    })

    toast.success("Investigation ouverte", {
      description: `Dossier ${ref} — ${client.trim()}${motivation.trim() ? " · motivation enregistrée" : ""}.`,
    })
    navigateTo("Investigations", { investigationRef: ref })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Nouvelle investigation</h3>
            <p className="mt-0.5 text-xs text-slate-400">Ouverture de dossier — prise en charge analyste (INV-01)</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600">Origine du dossier</label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {([
              { v: "alerte" as const, label: "Depuis une alerte" },
              { v: "signalement" as const, label: "Signalement manuel" },
            ]).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setSource(o.v)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                  source === o.v
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {source === "alerte" ? (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-600">Alerte source</label>
            <select
              value={alertRef}
              onChange={(e) => setAlertRef(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            >
              {MOCK_ALERTS.map((a) => (
                <option key={a.ref} value={a.ref}>
                  {a.ref} — {a.client} ({a.type}, {a.score}/100)
                </option>
              ))}
            </select>
            {existingInv && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Un dossier en cours existe déjà ({existingInv.ref}). La validation ouvrira ce dossier.
                </span>
              </div>
            )}
            {selectedAlert && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400">Score</p>
                  <p className="text-sm font-semibold text-indigo-600">{selectedAlert.score}/100</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400">Module</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedAlert.module}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400">Niveau</p>
                  <p className="text-sm font-semibold capitalize text-slate-900">{selectedAlert.level}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-600">Client concerné</label>
            <input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Nom du client (ex. Traoré, Moussa)"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600">Type d'investigation</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={source === "alerte" && !!selectedAlert}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-70"
          >
            {INVESTIGATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600">Motivation initiale (optionnel)</label>
          <textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            rows={3}
            placeholder="Contexte de la prise en charge, éléments factuels initiaux..."
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <FolderSearch className="h-3.5 w-3.5" />
            Ouvrir le dossier
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          Traçabilité : auteur et date d'ouverture enregistrés automatiquement (INV-04)
        </p>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { X, FolderSearch, AlertTriangle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/dashboard-context"
import { INVESTIGATION_TYPES, type NewInvestigationPrefill } from "@/lib/alerts-data"
import { navigateTo } from "@/lib/navigate"
import { alertService } from "@/services/alertService"
import { clientService } from "@/services/clientService"
import { investigationService } from "@/services/investigationService"
import type { Alert } from "@/models/alert"
import type { Client } from "@/models/client"

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
  const { investigations, userName } = useDashboard()
  const [source, setSource] = useState<SourceMode>("alerte")
  const [selectedAlertId, setSelectedAlertId] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [type, setType] = useState<string>(INVESTIGATION_TYPES[0])
  const [motivation, setMotivation] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Données dynamiques réelles
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingData(true)
    Promise.all([
      alertService.getAlerts().catch(() => [] as Alert[]),
      clientService.getClients().catch(() => [] as Client[]),
    ])
      .then(([fetchedAlerts, fetchedClients]) => {
        setAlerts(fetchedAlerts)
        setClients(fetchedClients)

        if (prefill?.alertRef) {
          setSource("alerte")
          const target = fetchedAlerts.find((a) => a.ref === prefill.alertRef)
          if (target) {
            setSelectedAlertId(target.id)
            setSelectedClientId(target.clientId)
            setType(prefill.type || target.type || INVESTIGATION_TYPES[0])
          }
        } else if (prefill?.client) {
          setSource("signalement")
          const matchedCli = fetchedClients.find(
            (c) => `${c.nom} ${c.prenom || ""}`.toLowerCase().includes(prefill.client!.toLowerCase())
          )
          if (matchedCli) setSelectedClientId(matchedCli.id)
          setType(prefill.type || "Signalement manuel")
        } else if (fetchedAlerts.length > 0) {
          setSource("alerte")
          const firstUnassigned = fetchedAlerts.find(
            (a) => !investigations.some((i) => i.alertRef === a.ref && i.status === "en_cours")
          ) || fetchedAlerts[0]
          setSelectedAlertId(firstUnassigned.id)
          setSelectedClientId(firstUnassigned.clientId)
          setType(firstUnassigned.type || INVESTIGATION_TYPES[0])
        }
      })
      .finally(() => setLoadingData(false))

    setMotivation("")
  }, [open, prefill, investigations])

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId)
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  useEffect(() => {
    if (source === "alerte" && selectedAlert) {
      setSelectedClientId(selectedAlert.clientId)
      if (selectedAlert.type) setType(selectedAlert.type)
    }
  }, [source, selectedAlert])

  if (!open) return null

  const existingInv = selectedAlert
    ? investigations.find((i) => i.alertRef === selectedAlert.ref && i.status === "en_cours")
    : null

  const submit = async () => {
    if (existingInv) {
      toast.info("Dossier existant", {
        description: `${existingInv.ref} est déjà ouvert pour cette alerte.`,
      })
      navigateTo("Investigations", { investigationRef: existingInv.ref })
      onClose()
      return
    }

    const clientIdToUse = selectedClientId || selectedAlert?.clientId
    if (!clientIdToUse) {
      toast.error("Client requis", { description: "Veuillez sélectionner un client ou une alerte valide." })
      return
    }

    setSubmitting(true)
    try {
      const maxNum = investigations.reduce((max, inv) => {
        const n = parseInt(inv.ref.replace("INV-", ""), 10)
        return Number.isNaN(n) ? max : Math.max(max, n)
      }, 245)
      const ref = `INV-${maxNum + 1}`

      const payload = {
        reference: ref,
        client_id: clientIdToUse,
        alerte_id: source === "alerte" && selectedAlert ? selectedAlert.id : undefined,
        analyste: userName || "A. Touré",
        type_motif: type,
        journal_notes: motivation.trim() || `Dossier ouvert le ${new Date().toLocaleDateString("fr-FR")}`,
      }

      const created = await investigationService.createInvestigation(payload)

      if (source === "alerte" && selectedAlert?.id) {
        await alertService.updateAlertStatus(selectedAlert.id, {
          statut: "en_cours",
          analyste: userName || "A. Touré",
        }).catch(() => {})
      }

      toast.success("Investigation ouverte", {
        description: `Dossier ${created.reference || ref} créé et enregistré en base de données.`,
      })

      window.dispatchEvent(new CustomEvent("lakana-investigation-updated"))
      navigateTo("Investigations", { investigationRef: created.reference || ref })
      onClose()
    } catch (err) {
      console.error("Erreur création investigation :", err)
      toast.error("Erreur d'ouverture", { description: "Impossible d'enregistrer le dossier sur l'API." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Nouvelle investigation</h3>
            <p className="mt-0.5 text-xs text-slate-400">Ouverture de dossier officiel LBC/FT — Prise en charge analyste</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600">Origine du dossier</label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {[
              { v: "alerte" as const, label: "Depuis une alerte" },
              { v: "signalement" as const, label: "Signalement manuel" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setSource(o.v)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-semibold transition cursor-pointer",
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

        {loadingData ? (
          <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Chargement des données en direct...</span>
          </div>
        ) : source === "alerte" ? (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-600">Alerte source</label>
            <select
              value={selectedAlertId}
              onChange={(e) => setSelectedAlertId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:bg-white"
            >
              {alerts.length === 0 ? (
                <option value="">Aucune alerte disponible</option>
              ) : (
                alerts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.ref} — {a.client} ({a.type}, {a.score}/100)
                  </option>
                ))
              )}
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
                  <p className="text-xs text-slate-400">Score</p>
                  <p className="text-sm font-semibold text-indigo-600">{selectedAlert.score}/100</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-xs text-slate-400">Module</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedAlert.module}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <p className="text-xs text-slate-400">Niveau</p>
                  <p className="text-sm font-semibold capitalize text-slate-900">{selectedAlert.level}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-600">Client concerné</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:bg-white"
            >
              <option value="">Sélectionner un client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.prenom || ""} ({c.codeClient}) — Risque : {c.niveauRisque}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600">Type d'investigation</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:bg-white"
          >
            {INVESTIGATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600">Motivation initiale de l'analyste</label>
          <textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            rows={3}
            placeholder="Contexte de la prise en charge, motifs de soupçon et éléments factuels..."
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm outline-none focus:border-indigo-300 focus:bg-white"
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={submitting || loadingData}
            onClick={submit}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FolderSearch className="h-3.5 w-3.5" />
            )}
            <span>{submitting ? "Création en cours..." : "Ouvrir le dossier"}</span>
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Traçabilité SHA-256 : l'ouverture est enregistrée dans le journal d'audit conforme BCEAO.
        </p>
      </div>
    </div>
  )
}

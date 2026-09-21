"use client"

import { useState, useEffect } from "react"
import { Settings, Save, RotateCcw, ShieldAlert, Sliders, Building2, Lock, History, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/lib/dashboard-context"

const tabs = ["Général", "Scoring", "Seuils réglementaires", "Institutions", "Sécurité"] as const
type Tab = (typeof tabs)[number]

const scoringRules = [
  { id: "R-FRC-01", label: "Fractionnement — cumul > seuil (48h)", weight: 30, max: 40 },
  { id: "R-VOL-01", label: "Volume > 3× moyenne historique", weight: 25, max: 30 },
  { id: "R-FREQ-01", label: "Fréquence > 10 transactions/jour", weight: 20, max: 25 },
  { id: "R-PPE-01", label: "Correspondance exacte PPE", weight: 15, max: 20 },
  { id: "R-REL-01", label: "Virement vers bénéficiaire signalé", weight: 10, max: 15 },
]

const thresholds = [
  { label: "Seuil de déclaration (FCFA)", value: 1000000, unit: "FCFA", desc: "Seuil réglementaire de déclaration de soupçon", code: "BO-04" },
  { label: "Seuil de fractionnement unitaire", value: 950000, unit: "FCFA", desc: "Transactions individuelles sous ce seuil surveillées", code: "FRC-03" },
  { label: "Fenêtre de fractionnement", value: 48, unit: "heures", desc: "Période de regroupement des séquences", code: "FRC-03" },
  { label: "Seuil d'alerteancienneté (hors ligne)", value: 24, unit: "heures", desc: "Alerte si base locale plus ancienne", code: "OFF-03" },
  { label: "Verrouillage après tentatives", value: 5, unit: "essais", desc: "Verrouillage compte après échecs", code: "AUTH-04" },
  { label: "Déconnexion inactivité", value: 30, unit: "minutes", desc: "Session inactive", code: "AUTH-07" },
]

const versions = [
  { v: "v2.4", date: "25/08/2026 13:42", author: "F. Koné (Responsable)", changes: "Pondération FRC ajustée 28→30 pts" },
  { v: "v2.3", date: "20/08/2026 10:15", author: "F. Koné (Responsable)", changes: "Seuil fractionnement 900k→950k FCFA" },
  { v: "v2.2", date: "15/08/2026 16:30", author: "F. Koné (Responsable)", changes: "Fenêtre fractionnement 24h→48h" },
  { v: "v2.1", date: "01/08/2026 09:00", author: "S. Traoré (Admin)", changes: "Verrouillage 3→5 essais" },
]

type InstType = "SFD" | "IMF" | "Banque" | "Coopérative"
type InstCity = "Bamako" | "Sikasso" | "Kayes" | "Ségou" | "Mopti"

type Institution = {
  name: string
  type: InstType
  city: InstCity
  clients: number
  isolated: boolean
}

const initialInstitutions: Institution[] = [
  { name: "SFD Bamako", type: "SFD", city: "Bamako", clients: 5421, isolated: true },
  { name: "SFD Sikasso", type: "SFD", city: "Sikasso", clients: 3120, isolated: true },
  { name: "SFD Kayes", type: "SFD", city: "Kayes", clients: 2044, isolated: true },
]

export function SettingsView() {
  const { settings, setSettings, saveSettings } = useDashboard()
  const [tab, setTab] = useState<Tab>("Général")
  const weights = settings.weights
  const setWeights = (next: number[]) => setSettings((s) => ({ ...s, weights: next }))
  const thVals = settings.thresholds
  const setThVals = (next: number[]) => setSettings((s) => ({ ...s, thresholds: next }))
  const mfa = settings.mfa
  const setMfa = (v: boolean) => setSettings((s) => ({ ...s, mfa: v }))
  const autoLock = settings.autoLock
  const setAutoLock = (v: boolean) => setSettings((s) => ({ ...s, autoLock: v }))
  const general = { institution: settings.institution, devise: settings.devise, langue: settings.langue }
  const setGeneral = (g: typeof general) =>
    setSettings((s) => ({ ...s, institution: g.institution, devise: g.devise, langue: g.langue }))
  const [institutions, setInstitutions] = useState<Institution[]>(initialInstitutions)
  const [createInstOpen, setCreateInstOpen] = useState(false)
  const [instForm, setInstForm] = useState({
    name: "",
    type: "SFD" as "SFD" | "IMF" | "Banque" | "Coopérative",
    city: "Bamako" as "Bamako" | "Sikasso" | "Kayes" | "Ségou" | "Mopti",
    isolated: true,
  })

  useEffect(() => {
    if (!createInstOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCreateInstOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [createInstOpen])

  const submitNewInstitution = () => {
    if (!instForm.name.trim()) {
      toast.error("Nom requis", { description: "Veuillez saisir le nom de l'institution." })
      return
    }
    setInstitutions([
      ...institutions,
      {
        name: instForm.name.trim(),
        type: instForm.type,
        city: instForm.city,
        clients: 0,
        isolated: instForm.isolated,
      },
    ])
    toast.success("Institution créée", {
      description: `${instForm.name.trim()} (${instForm.type}, ${instForm.city}) ajoutée. Isolation des données ${instForm.isolated ? "activée" : "désactivée"} (BO-08).`,
    })
    setInstForm({ name: "", type: "SFD", city: "Bamako", isolated: true })
    setCreateInstOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Paramètres</h1>
          <p className="mt-1 text-sm text-slate-500">Configuration du moteur d'analyse et des seuils réglementaires (BO-03/04).</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSettings({
                institution: "SFD Bamako",
                devise: "FCFA (XOF)",
                langue: "Français",
                weights: scoringRules.map((r) => r.weight),
                thresholds: thresholds.map((t) => t.value),
                mfa: true,
                autoLock: true,
              })
              toast.info("Paramètres restaurés", { description: "Restauration aux valeurs par défaut (BO-03)." })
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurer
          </button>
          <button
            onClick={() => {
              saveSettings()
              toast.success("Paramètres enregistrés", {
                description: `Institution : ${general.institution} · Devise : ${general.devise} · Langue : ${general.langue}. Modifications tracées (BO-03).`,
              })
            }}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Save className="h-3.5 w-3.5" />
            Enregistrer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition",
              tab === t ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Général */}
      {tab === "Général" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">Informations plateforme</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">Nom de l'institution</label>
                <input value={general.institution} onChange={(e) => setGeneral({ ...general, institution: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Devise</label>
                <input value={general.devise} onChange={(e) => setGeneral({ ...general, devise: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Langue</label>
                <input value={general.langue} onChange={(e) => setGeneral({ ...general, langue: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">Notifications système</h3>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Alertes bloquantes non traitées", on: true },
                { label: "Investigations > 24h", on: true },
                { label: "Échec de synchronisation", on: true },
                { label: "Nouvel import de liste", on: false },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{n.label}</span>
                  <Switch defaultChecked={n.on} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scoring */}
      {tab === "Scoring" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-slate-400" />
                <h3 className="text-base font-semibold text-slate-900">Pondération des règles (BO-03)</h3>
              </div>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                Total : {weights.reduce((a, b) => a + b, 0)} pts
              </Badge>
            </div>
            <div className="mt-5 space-y-4">
              {scoringRules.map((r, i) => (
                <div key={r.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">{r.id}</span>
                      <span className="text-sm font-medium text-slate-700">{r.label}</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">{weights[i]} pts</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={r.max}
                    value={weights[i]}
                    onChange={(e) => {
                      const next = [...weights]
                      next[i] = Number(e.target.value)
                      setWeights(next)
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">Historique des versions (BO-03)</h3>
            </div>
            <div className="mt-4 space-y-2">
              {versions.map((v) => (
                <div key={v.v} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">{v.v}</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{v.changes}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{v.author} • {v.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Seuils */}
      {tab === "Seuils réglementaires" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Seuils et fenêtres (BO-04)</h3>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              Modifications tracées
            </Badge>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {thresholds.map((t, i) => (
              <div key={t.label} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">{t.label}</label>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{t.code}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    value={thVals[i]}
                    onChange={(e) => {
                      const next = [...thVals]
                      next[i] = Number(e.target.value)
                      setThVals(next)
                    }}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="shrink-0 text-xs font-medium text-slate-500">{t.unit}</span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institutions */}
      {tab === "Institutions" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">Institutions (multi-SFD, BO-08)</h3>
            </div>
            <button onClick={() => setCreateInstOpen(true)} className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700">
              + Ajouter
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {institutions.map((inst) => (
              <div key={inst.name} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{inst.name}</p>
                  <p className="text-[11px] text-slate-400">{inst.clients.toLocaleString("fr-FR")} clients</p>
                </div>
                {inst.isolated && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    Données isolées
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sécurité */}
      {tab === "Sécurité" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">Authentification (AUTH)</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">MFA obligatoire (rôles sensibles)</p>
                  <p className="text-[11px] text-slate-400">Responsable, Admin, Super admin (AUTH-05)</p>
                </div>
                <Switch checked={mfa} onCheckedChange={setMfa} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Verrouillage automatique</p>
                  <p className="text-[11px] text-slate-400">Après 5 tentatives échouées (AUTH-04)</p>
                </div>
                <Switch checked={autoLock} onCheckedChange={setAutoLock} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Longueur minimale mot de passe</label>
                <input type="number" defaultValue={12} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Renouvellement périodique (jours)</label>
                <input type="number" defaultValue={90} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900">Sessions actives</h3>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { user: "A. Touré", ip: "10.0.1.42", since: "14:32", current: true },
                { user: "M. Diallo", ip: "10.0.1.55", since: "11:08", current: false },
                { user: "F. Koné", ip: "10.0.1.12", since: "09:15", current: false },
              ].map((s) => (
                <div key={s.user} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{s.user}</p>
                    <p className="text-[11px] text-slate-400">{s.ip} • depuis {s.since}</p>
                  </div>
                  {s.current ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Vous</Badge>
                  ) : (
                    <button onClick={() => toast.success("Session déconnectée", { description: `${s.user} a été déconnecté.` })} className="text-xs font-semibold text-rose-600 hover:underline">Déconnecter</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create institution modal */}
      {createInstOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setCreateInstOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Nouvelle institution</h3>
                <p className="mt-0.5 text-xs text-slate-400">Multi-SFD avec isolation des données (BO-08)</p>
              </div>
              <button
                onClick={() => setCreateInstOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Nom de l'institution</label>
                <input
                  value={instForm.name}
                  onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                  placeholder="Ex. SFD Mopti"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Type</label>
                  <select
                    value={instForm.type}
                    onChange={(e) => setInstForm({ ...instForm, type: e.target.value as Institution["type"] })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="SFD">SFD</option>
                    <option value="IMF">IMF</option>
                    <option value="Banque">Banque</option>
                    <option value="Coopérative">Coopérative</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Ville</label>
                  <select
                    value={instForm.city}
                    onChange={(e) => setInstForm({ ...instForm, city: e.target.value as Institution["city"] })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Bamako">Bamako</option>
                    <option value="Sikasso">Sikasso</option>
                    <option value="Kayes">Kayes</option>
                    <option value="Ségou">Ségou</option>
                    <option value="Mopti">Mopti</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Isolation des données</p>
                  <p className="text-[11px] text-slate-400">BO-08 — données cloisonnées par institution</p>
                </div>
                <Switch
                  checked={instForm.isolated}
                  onCheckedChange={(v) => setInstForm({ ...instForm, isolated: v })}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setCreateInstOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={submitNewInstitution}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Créer l'institution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

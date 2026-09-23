"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Settings2,
  RefreshCw,
  MessageSquare,
  Mail,
  Send,
  Smartphone,
  ExternalLink,
  Check,
  Shield,
  Layers,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { alertService } from "@/services/alertService"
import { filteringService, type DispatchedNotification } from "@/services/filteringService"

type Notif = {
  id: string
  type: "bloquante" | "investigation" | "synchro" | "liste" | "systeme"
  title: string
  desc: string
  time: string
  read: boolean
}

const notifs: Notif[] = [
  { id: "N-012", type: "bloquante", title: "Alerte bloquante non traitée", desc: "ALR-241 (Traoré M.) : score 87/100, en attente depuis 2h.", time: "Il y a 12 min", read: false },
  { id: "N-011", type: "bloquante", title: "Correspondance PPE confirmée", desc: "FLT-225 (Touré A.) : similarité 99%, mesure de gel requise.", time: "Il y a 1h", read: false },
  { id: "N-010", type: "investigation", title: "Investigation > 24h", desc: "INV-238 (Diarra F.) en cours depuis 26h.", time: "Il y a 2h", read: false },
  { id: "N-009", type: "synchro", title: "Connecteur dégradé", desc: "SFD Kayes : dernière synchronisation il y a 5h.", time: "Il y a 3h", read: true },
  { id: "N-008", type: "liste", title: "Nouvelle version de liste importée", desc: "Liste PPE Mali v2.4 : 286 enregistrements.", time: "Il y a 5h", read: true },
  { id: "N-007", type: "investigation", title: "Investigation clôturée", desc: "INV-229 (Coulibaly A.) classée sans suite.", time: "Hier", read: true },
  { id: "N-006", type: "systeme", title: "Tentative de connexion échouée", desc: "Compte A. Diarra verrouillé après 5 essais (AUTH-04).", time: "Hier", read: true },
  { id: "N-005", type: "synchro", title: "Resynchronisation complète", desc: "Base locale mise à jour : 18 428 enregistrements.", time: "Hier", read: true },
]

const typeConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  bloquante: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle, label: "Bloquante" },
  investigation: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Investigation" },
  synchro: { color: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: Bell, label: "Synchronisation" },
  liste: { color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: ShieldAlert, label: "Liste" },
  systeme: { color: "bg-slate-100 text-slate-600 border-slate-200", icon: Settings2, label: "Système" },
}

const filters = ["Toutes", "Non lues", "Bloquantes", "Investigations"] as const

function formatAmount(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n)
}

export function NotificationsView() {
  const [mainTab, setMainTab] = useState<"internal" | "channels">("internal")
  const [filter, setFilter] = useState<(typeof filters)[number]>("Toutes")
  const [items, setItems] = useState<Notif[]>(notifs)
  const [dispatched, setDispatched] = useState<DispatchedNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [notifToDelete, setNotifToDelete] = useState<Notif | null>(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [testingDispatch, setTestingDispatch] = useState(false)

  const handleTestDispatch = async () => {
    setTestingDispatch(true)
    try {
      const res = await filteringService.testDispatch("+22364663918", "fombadaouda72@gmail.com")
      await fetchDispatched()
      if (res.whatsapp_statut?.includes("delivre")) {
        toast.success(`Alerte WhatsApp expédiée en direct au ${res.whatsapp_destinataire}`)
      } else {
        toast.info(`WhatsApp (${res.whatsapp_statut}) : Vérifiez votre WASENDER_API_KEY dans backend/.env (compte https://wasenderapi.com/dashboard)`)
      }

      if (res.email_statut?.includes("delivre")) {
        toast.success(`Fiche CENTIF expédiée par Email à ${res.email_destinataire}`)
      } else {
        toast.info(`Email (${res.email_statut}) : Renseignez SMTP_PASSWORD dans backend/.env pour l'envoi Gmail réel`)
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du test des canaux")
    } finally {
      setTestingDispatch(false)
    }
  }

  const fetchNotifs = async () => {
    setLoading(true)
    try {
      const alerts = await alertService.getAlerts()
      const bloquantes = alerts.filter((a) => a.level === "bloquante" || a.score >= 75)
      if (bloquantes.length > 0) {
        const dynamicNotifs: Notif[] = bloquantes.map((a, i) => ({
          id: `N-DYN-${a.id.slice(0, 5)}`,
          type: "bloquante",
          title: `Alerte ${a.level === "bloquante" ? "bloquante" : "critique"} non traitée`,
          desc: `${a.ref || "ALR"} (${a.client}) : score ${a.score}/100, type: ${a.type}`,
          time: i === 0 ? "Il y a 5 min" : `Il y a ${(i + 1) * 15} min`,
          read: false,
        }))
        const existingIds = new Set(dynamicNotifs.map((n) => n.desc))
        const remaining = notifs.filter((n) => !existingIds.has(n.desc))
        setItems([...dynamicNotifs, ...remaining])
      }
    } catch (e) {
      console.warn("Erreur chargement notifications:", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchDispatched = async () => {
    try {
      const data = await filteringService.getDispatchedNotifications()
      setDispatched(data)
    } catch (e) {
      console.warn("Erreur chargement notifications transmises:", e)
    }
  }

  useEffect(() => {
    fetchNotifs()
    fetchDispatched()
  }, [])

  const filtered = items.filter((n) => {
    if (filter === "Toutes") return true
    if (filter === "Non lues") return !n.read
    if (filter === "Bloquantes") return n.type === "bloquante"
    if (filter === "Investigations") return n.type === "investigation"
    return true
  })

  const confirmDeleteSingle = () => {
    if (!notifToDelete) return
    const target = notifToDelete
    setItems((arr) => arr.filter((n) => n.id !== target.id))
    toast.success("Notification supprimée")
    setNotifToDelete(null)
  }

  const confirmClearAll = () => {
    setItems([])
    toast.success("Toutes les notifications ont été effacées")
    setClearAllOpen(false)
  }

  const markRead = (id: string) => {
    setItems((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = () => setItems((arr) => arr.map((n) => ({ ...n, read: true })))
  const unread = items.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      {/* En-tête avec onglets principaux */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-600" />
            Centre d'Alertes & Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Surveillance continue, déclencheurs multi-canaux (WhatsApp API & SMTP Email) et registre interne.
          </p>
        </div>

        {/* Sélecteur d'onglet */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setMainTab("internal")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              mainTab === "internal" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Alertes internes ({items.length})
          </button>
          <button
            onClick={() => {
              setMainTab("channels")
              fetchDispatched()
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              mainTab === "channels" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            WhatsApp & Email ({dispatched.length})
          </button>
        </div>
      </div>

      {/* ONGLET 1 : ALERTES INTERNES */}
      {mainTab === "internal" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            {/* Filters */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                    filter === f ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {f}
                  {f === "Non lues" && (
                    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                      {unread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifs}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                title="Actualiser"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </button>
              <button
                onClick={markAllRead}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tout marquer lu
              </button>
              {items.length > 0 && (
                <button
                  onClick={() => setClearAllOpen(true)}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/60 px-3 text-sm font-semibold text-rose-600 hover:bg-rose-100/70"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Tout effacer
                </button>
              )}
            </div>
          </div>

          {/* Stats KPI */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Non lues", value: unread, color: "#EF4444" },
              { label: "Bloquantes", value: items.filter((n) => n.type === "bloquante").length, color: "#F59E0B" },
              { label: "Aujourd'hui", value: items.length, color: "#6366F1" },
              { label: "Canaux externes", value: dispatched.length, color: "#10B981" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <p className="text-[13px] font-medium text-slate-500">{s.label}</p>
                </div>
                <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Notifications list */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {filtered.map((n) => {
                const tc = typeConfig[n.type]
                const Icon = tc.icon
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex items-start gap-3 px-5 py-4 transition hover:bg-slate-50",
                      !n.read && "bg-indigo-50/30 cursor-pointer"
                    )}
                  >
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tc.color.split(" ")[0], tc.color.split(" ")[1])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm", n.read ? "font-medium text-slate-700" : "font-semibold text-slate-900")}>
                          {n.title}
                        </p>
                        <Badge variant="outline" className={cn("border text-[11px]", tc.color)}>{tc.label}</Badge>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{n.desc}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{n.time}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setNotifToDelete(n)
                      }}
                      title="Supprimer la notification"
                      className="rounded-md p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-200" />
                <p className="mt-2 text-sm text-slate-400">Aucune notification</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET 2 : CANAUX WHATSAPP & EMAIL */}
      {mainTab === "channels" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Bannière de configuration passerelles réelles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WasenderAPI WhatsApp</p>
                  <p className="text-sm font-bold text-slate-800">+223 64 66 39 18</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                WASENDER API
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Courriel Destinataire</p>
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[170px]" title="fombadaouda72@gmail.com">
                    fombadaouda72@gmail.com
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                <Check className="w-3 h-3 text-blue-500" />
                SMTP ACTIF
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Protocole CENTIF / UEMOA</p>
                  <p className="text-sm font-bold text-slate-800">Seuils 5M & 15M FCFA</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                AUTOMATIQUE
              </span>
            </div>
          </div>

          {/* Bannière d'information configuration API & Test direct */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-sm flex items-center gap-2 text-indigo-200">
                <Send className="w-4 h-4 text-emerald-400" />
                Passerelles de Notification en Temps Réel
              </p>
              <p className="text-xs text-slate-300">
                Destinataires configurés : WhatsApp direct au <strong className="text-emerald-300">+223 64 66 39 18</strong> et Courriel officiel à <strong className="text-blue-300">fombadaouda72@gmail.com</strong>.
              </p>
            </div>
            <button
              onClick={handleTestDispatch}
              disabled={testingDispatch}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow shrink-0"
            >
              {testingDispatch ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Expédition en cours...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Tester l'envoi en direct (WhatsApp & Email)
                </>
              )}
            </button>
          </div>

          {/* Liste des transmissions multi-canaux */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  Journal des alertes transmises par WhatsApp & Email
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chaque alerte détectée au guichet ou par trigger est expédiée simultanément vers +223 64663918 et fombadaouda72@gmail.com.
                </p>
              </div>
              <button
                onClick={fetchDispatched}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Actualiser
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {dispatched.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <Send className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Aucune alerte expédiée pour le moment</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Exécutez une simulation avec un montant ≥ 15 000 000 FCFA ou un sociétaire PPE pour déclencher l'envoi WhatsApp et Email.
                  </p>
                </div>
              ) : (
                dispatched.map((notif) => {
                  const isWhatsApp = notif.channel?.toLowerCase().includes("whatsapp")
                  return (
                    <div key={notif.id} className="p-5 hover:bg-slate-50/50 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {notif.alerte_ref || notif.id}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{notif.type_alerte}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              notif.niveau === "bloquante"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {(notif.niveau || "ALERTE").toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {notif.created_at ? new Date(notif.created_at).toLocaleString("fr-FR") : "Récemment"}
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-xl border space-y-2 ${
                          isWhatsApp
                            ? "bg-emerald-50/50 border-emerald-200"
                            : "bg-blue-50/50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`flex items-center gap-1.5 text-xs font-bold ${
                              isWhatsApp ? "text-emerald-800" : "text-blue-800"
                            }`}
                          >
                            {isWhatsApp ? (
                              <MessageSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Mail className="w-4 h-4 text-blue-600" />
                            )}
                            Canal : {notif.channel}
                          </span>
                          <span
                            className={`text-[10px] font-bold bg-white px-2 py-0.5 rounded border ${
                              isWhatsApp
                                ? "text-emerald-700 border-emerald-200"
                                : "text-blue-700 border-blue-200"
                            }`}
                          >
                            {notif.statut_envoi.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                          <p>
                            Destinataire : <strong className="text-slate-800">{notif.destinataire}</strong>
                          </p>
                          <p>
                            Sociétaire : <strong className="text-slate-800">{notif.client_nom}</strong>
                            {notif.montant_fcfa != null && notif.montant_fcfa > 0 && (
                              <span> • Montant : <strong className="text-indigo-600">{formatAmount(notif.montant_fcfa)}</strong></span>
                            )}
                          </p>
                        </div>
                        <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200/80 text-xs text-slate-700 font-mono whitespace-pre-wrap shadow-2xs">
                          {notif.contenu}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialogue de confirmation suppression unique */}
      <ConfirmDialog
        open={!!notifToDelete}
        onOpenChange={(open) => !open && setNotifToDelete(null)}
        title="Supprimer la notification ?"
        description={
          notifToDelete ? (
            <span>
              Êtes-vous sûr de vouloir supprimer la notification <strong>« {notifToDelete.title} »</strong> ?
            </span>
          ) : null
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmDeleteSingle}
      />

      {/* Dialogue de confirmation suppression totale */}
      <ConfirmDialog
        open={clearAllOpen}
        onOpenChange={setClearAllOpen}
        title="Effacer toutes les notifications ?"
        description="Cette opération effacera l'ensemble de vos notifications actives. Êtes-vous sûr de vouloir continuer ?"
        confirmText="Tout effacer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmClearAll}
      />
    </div>
  )
}

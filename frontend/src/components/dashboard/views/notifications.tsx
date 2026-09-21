"use client"

import { useState } from "react"
import { Bell, AlertTriangle, Clock, ShieldAlert, CheckCircle2, Trash2, Settings2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"

type Notif = {
  id: string
  type: "bloquante" | "investigation" | "synchro" | "liste" | "systeme"
  title: string
  desc: string
  time: string
  read: boolean
}

const notifs: Notif[] = [
  { id: "N-012", type: "bloquante", title: "Alerte bloquante non traitée", desc: "ALR-241 (Traoré M.) — score 87/100, en attente depuis 2h.", time: "Il y a 12 min", read: false },
  { id: "N-011", type: "bloquante", title: "Correspondance PPE confirmée", desc: "FLT-225 (Touré A.) — similarité 99%, mesure de gel requise.", time: "Il y a 1h", read: false },
  { id: "N-010", type: "investigation", title: "Investigation > 24h", desc: "INV-238 (Diarra F.) en cours depuis 26h.", time: "Il y a 2h", read: false },
  { id: "N-009", type: "synchro", title: "Connecteur dégradé", desc: "SFD Kayes — dernière synchronisation il y a 5h.", time: "Il y a 3h", read: true },
  { id: "N-008", type: "liste", title: "Nouvelle version de liste importée", desc: "Liste PPE Mali v2.4 — 286 enregistrements.", time: "Il y a 5h", read: true },
  { id: "N-007", type: "investigation", title: "Investigation clôturée", desc: "INV-229 (Coulibaly A.) classée sans suite.", time: "Hier", read: true },
  { id: "N-006", type: "systeme", title: "Tentative de connexion échouée", desc: "Compte A. Diarra verrouillé après 5 essais (AUTH-04).", time: "Hier", read: true },
  { id: "N-005", type: "synchro", title: "Resynchronisation complète", desc: "Base locale mise à jour — 18 428 enregistrements.", time: "Hier", read: true },
]

const typeConfig: Record<Notif["type"], { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  bloquante: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle, label: "Bloquante" },
  investigation: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Investigation" },
  synchro: { color: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: Bell, label: "Synchronisation" },
  liste: { color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: ShieldAlert, label: "Liste" },
  systeme: { color: "bg-slate-100 text-slate-600 border-slate-200", icon: Settings2, label: "Système" },
}

const filters = ["Toutes", "Non lues", "Bloquantes", "Investigations"] as const

export function NotificationsView() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Toutes")
  const [items, setItems] = useState(notifs)
  const [notifToDelete, setNotifToDelete] = useState<Notif | null>(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)

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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Alertes internes : délais, seuils dépassés, événements système (BO-09).</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Non lues", value: unread, color: "#EF4444" },
          { label: "Bloquantes", value: items.filter((n) => n.type === "bloquante").length, color: "#F59E0B" },
          { label: "Aujourd'hui", value: items.length, color: "#6366F1" },
          { label: "Cette semaine", value: 34, color: "#06B6D4" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              <p className="text-[13px] font-medium text-slate-500">{s.label}</p>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

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
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
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
                    <Badge variant="outline" className={cn("border", tc.color)}>{tc.label}</Badge>
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

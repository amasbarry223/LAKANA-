"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, ShieldCheck, Search, KeyRound, Plus, Pencil, Power, X, Check, Phone, MessageSquare, Mail, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { userService, type UserItem, type Role } from "@/services/userService"

const roleBadgeColor: Record<Role, string> = {
  "Analyste de conformité": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Agent guichet": "bg-amber-50 text-amber-700 border-amber-200",
}

// Matrice réglementaire stricte à 2 rôles : Analyste de conformité & Agent guichet
const rbacMatrix = [
  { module: "Alertes & Détections", analyste: "Traitement intégral", guichet: "Consultation" },
  { module: "Dossiers d'investigation (CENTIF)", analyste: "Instruction & Déclaration", guichet: "—" },
  { module: "Contrôle d'opération au guichet", analyste: "Contrôle approfondi", guichet: "Vérification immédiate" },
  { module: "Vérification Sanctions & PPE", analyste: "Contrôle & Validation", guichet: "Consultation des listes" },
  { module: "Fiches Sociétaires & Flux", analyste: "Analyse intégrale", guichet: "Consultation simplifiée" },
  { module: "Rapports CENTIF & États", analyste: "Génération & Export", guichet: "—" },
  { module: "Piste d'audit SHA-256", analyste: "Consultation intégrale", guichet: "—" },
]

export function UsersView() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Formulaire d'édition / création
  const [formData, setFormData] = useState<{
    name: string
    email: string
    telephone: string
    role: Role
    institution: string
  }>({
    name: "",
    email: "",
    telephone: "",
    role: "Analyste de conformité",
    institution: "SFD Bamako (Siège)",
  })

  // Chargement des utilisateurs réels depuis l'API / base de données
  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await userService.getUsers()
      setUsers(data)
    } catch {
      toast.error("Impossible de charger les utilisateurs.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      telephone: "+223 ",
      role: "Analyste de conformité",
      institution: "SFD Bamako (Siège)",
    })
    setIsModalOpen(true)
  }

  const openEditModal = (u: UserItem) => {
    setEditingUser(u)
    setFormData({
      name: u.nomComplet,
      email: u.email,
      telephone: u.telephone || "+223 ",
      role: u.role,
      institution: u.institution,
    })
    setIsModalOpen(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Veuillez renseigner le nom et l'adresse email.")
      return
    }

    setSubmitting(true)
    try {
      if (editingUser) {
        // Modification
        await userService.updateUser(editingUser.id, {
          nom_complet: formData.name.trim(),
          email: formData.email.trim(),
          telephone: formData.telephone.trim() || undefined,
          role: formData.role,
          institution: formData.institution.trim(),
        })
        toast.success(`Compte de ${formData.name} mis à jour avec son numéro d'alerte.`)
      } else {
        // Création
        await userService.createUser({
          nom_complet: formData.name.trim(),
          email: formData.email.trim(),
          telephone: formData.telephone.trim() || undefined,
          role: formData.role,
          institution: formData.institution.trim() || "SFD Bamako",
          mfa_enabled: formData.role === "Analyste de conformité",
        })
        toast.success(`Utilisateur ${formData.name} créé avec le rôle ${formData.role}.`)
      }
      setIsModalOpen(false)
      loadUsers()
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enregistrement de l'utilisateur.")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      const res = await userService.toggleUserActive(userId)
      toast.success(res.message)
      loadUsers()
    } catch {
      toast.error("Erreur lors du changement de statut de l'utilisateur.")
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.nomComplet.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.telephone && u.telephone.toLowerCase().includes(query.toLowerCase())) ||
      u.role.toLowerCase().includes(query.toLowerCase()) ||
      u.institution.toLowerCase().includes(query.toLowerCase())
  )

  const activeCount = users.filter((u) => u.isActive).length
  const analystCount = users.filter((u) => u.role === "Analyste de conformité" && u.isActive).length
  const guichetCount = users.filter((u) => u.role === "Agent guichet" && u.isActive).length

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-600" />
            Gestion des Utilisateurs & Canaux d'Alerte
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion des comptes (Analyste de conformité et Agent guichet) et configuration des numéros WhatsApp et emails pour l'expédition des alertes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
            title="Rafraîchir la liste"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-indigo-600")} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Indicateurs de gouvernance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Comptes configurés en BDD</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{users.length}</p>
          <p className="mt-1 text-xs text-slate-400">
            {activeCount} actif{activeCount > 1 ? "s" : ""} · {users.length - activeCount} désactivé{users.length - activeCount > 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Répartition des habilitations</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{analystCount} Analyste{analystCount > 1 ? "s" : ""}</p>
          <p className="mt-1 text-xs text-slate-400">{guichetCount} Agent{guichetCount > 1 ? "s" : ""} guichet</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Canaux WhatsApp & Email</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">Connectés en Direct</p>
          <p className="mt-1 text-xs text-slate-400">Alertes expédiées aux numéros et emails configurés</p>
        </div>
      </div>

      {/* Section 1 : Registre des utilisateurs avec actions */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Utilisateurs & Numéros d'Alertes</h3>
            <p className="text-xs text-slate-500">Les analystes de conformité reçoivent les alertes WhatsApp et emails à ces coordonnées.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom, email, téléphone..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {loading ? "Chargement des utilisateurs en cours..." : "Aucun utilisateur trouvé pour cette recherche."}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isDeactivated = !u.isActive
              return (
                <div
                  key={u.id}
                  className={cn(
                    "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                    isDeactivated ? "bg-slate-50/70 opacity-70" : "hover:bg-slate-50/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs",
                        isDeactivated
                          ? "bg-slate-200 text-slate-400"
                          : u.role === "Analyste de conformité"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {u.nomComplet
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("text-sm font-bold", isDeactivated ? "text-slate-500 line-through" : "text-slate-900")}>
                          {u.nomComplet}
                        </p>
                        <Badge variant="outline" className={cn("border text-2xs", roleBadgeColor[u.role])}>
                          {u.role}
                        </Badge>
                        {u.mfaEnabled && (
                          <span className="inline-flex items-center gap-0.5 text-2xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <KeyRound className="h-2.5 w-2.5" />
                            MFA
                          </span>
                        )}
                        {isDeactivated && (
                          <Badge variant="destructive" className="text-2xs bg-rose-100 text-rose-700 border-rose-200">
                            Accès suspendu
                          </Badge>
                        )}
                      </div>

                      {/* Coordonnées Email et WhatsApp */}
                      <div className="flex items-center gap-3 flex-wrap mt-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {u.email}
                        </span>
                        <span className="text-slate-300">·</span>
                        {u.telephone ? (
                          <span className="inline-flex items-center gap-1 font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            WhatsApp: {u.telephone}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                            <Phone className="h-3 w-3 text-amber-500" />
                            Numéro WhatsApp non configuré
                          </span>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400 text-[11px]">{u.institution}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions directes */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openEditModal(u)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      title="Modifier les informations et le numéro WhatsApp"
                    >
                      <Pencil className="h-3 w-3 text-slate-400" />
                      Modifier
                    </button>
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer",
                        isDeactivated
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                      )}
                      title={isDeactivated ? "Réactiver le compte" : "Désactiver le compte"}
                    >
                      <Power className={cn("h-3 w-3", isDeactivated ? "text-emerald-600" : "text-slate-400")} />
                      {isDeactivated ? "Réactiver" : "Désactiver"}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Section 2 : Matrice des droits d'accès simplifiée */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-4 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Matrice des privilèges d'accès</h3>
            <p className="text-xs text-slate-500">Séparation stricte des habilitations par rôle.</p>
          </div>
          <Badge variant="outline" className="border-slate-200 bg-white text-2xs text-slate-600">
            2 rôles exclusifs
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Module Métier</th>
                <th className="py-3 px-4">Analyste de conformité</th>
                <th className="py-3 px-4">Agent guichet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rbacMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{row.module}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-100 text-emerald-800">
                      {row.analyste}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold",
                        row.guichet === "—"
                          ? "text-slate-300"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {row.guichet}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création / Modification Utilisateur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? "Modifier l'utilisateur & ses canaux" : "Créer un nouvel utilisateur"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Aminata Touré"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse email professionnelle</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: a.toure@sfd.ml"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    Numéro de téléphone / WhatsApp pour les alertes
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Format international</span>
                </label>
                <input
                  type="text"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+223 64663918"
                  className="w-full rounded-lg border border-emerald-300 bg-emerald-50/30 px-3 py-2 text-xs outline-none focus:border-emerald-500 font-mono font-medium text-slate-900"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Les alertes d'interception PPE et demandes de visa seront expédiées directement à ce numéro via WhatsApp.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rôle dans le système</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="Analyste de conformité">Analyste de conformité (Instruction, Alertes & CENTIF)</option>
                  <option value="Agent guichet">Agent guichet (Vérifications & Contrôle opérations)</option>
                </select>
                <p className="mt-1 text-2xs text-slate-400">
                  Seuls les rôles Analyste de conformité et Agent guichet sont autorisés sur LAKANA.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Agence / Institution de rattachement</label>
                <input
                  type="text"
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="Ex: SFD Bamako (Siège)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 font-semibold text-white hover:bg-indigo-700 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Enregistrement..." : editingUser ? "Enregistrer les modifications" : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Users, ShieldCheck, Search, KeyRound, Plus, Pencil, Power, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Role = "Analyste de conformité" | "Agent guichet"

type DemoUser = {
  id: string
  name: string
  email: string
  role: Role
  mfa: boolean
  status: "Actif" | "Désactivé"
  lastLogin: string
  institution: string
}

const initialDemoUsers: DemoUser[] = [
  { id: "USR-01", name: "Aminata Touré", email: "a.toure@sfd.ml", role: "Analyste de conformité", mfa: true, status: "Actif", lastLogin: "Aujourd'hui 14:32", institution: "SFD Bamako (Siège)" },
  { id: "USR-02", name: "Moussa Diallo", email: "m.diallo@sfd.ml", role: "Analyste de conformité", mfa: true, status: "Actif", lastLogin: "Aujourd'hui 11:08", institution: "SFD Bamako (Siège)" },
  { id: "USR-03", name: "Bakary Diarra", email: "b.diarra@sfd.ml", role: "Agent guichet", mfa: true, status: "Actif", lastLogin: "Aujourd'hui 09:15", institution: "SFD Bamako (Guichet Central)" },
  { id: "USR-04", name: "Oumar Sangaré", email: "o.sangare@sfd.ml", role: "Agent guichet", mfa: false, status: "Actif", lastLogin: "Hier 16:40", institution: "SFD Sikasso (Guichet 2)" },
]

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
  const [users, setUsers] = useState<DemoUser[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lakana_users")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // fallback
        }
      }
    }
    return initialDemoUsers
  })

  const [query, setQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<DemoUser | null>(null)

  // Formulaire d'édition / création
  const [formData, setFormData] = useState<{
    name: string
    email: string
    role: Role
    institution: string
  }>({
    name: "",
    email: "",
    role: "Agent guichet",
    institution: "SFD Bamako (Guichet)",
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lakana_users", JSON.stringify(users))
    }
  }, [users])

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      role: "Agent guichet",
      institution: "SFD Bamako (Guichet Central)",
    })
    setIsModalOpen(true)
  }

  const openEditModal = (u: DemoUser) => {
    setEditingUser(u)
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      institution: u.institution,
    })
    setIsModalOpen(true)
  }

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Veuillez renseigner le nom et l'adresse email.")
      return
    }

    if (editingUser) {
      // Modification
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formData.name.trim(),
                email: formData.email.trim(),
                role: formData.role,
                institution: formData.institution.trim(),
              }
            : u
        )
      )
      toast.success(`Compte de ${formData.name} mis à jour avec succès.`)
    } else {
      // Création
      const newId = `USR-0${users.length + 1}`
      const newUser: DemoUser = {
        id: newId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        mfa: formData.role === "Analyste de conformité",
        status: "Actif",
        lastLogin: "Jamais connecté",
        institution: formData.institution.trim() || "SFD Bamako",
      }
      setUsers((prev) => [...prev, newUser])
      toast.success(`Utilisateur ${formData.name} créé avec le rôle ${formData.role}.`)
    }
    setIsModalOpen(false)
  }

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === "Actif" ? "Désactivé" : "Actif"
          if (nextStatus === "Désactivé") {
            toast.warning(`Accès suspendu pour ${u.name}.`)
          } else {
            toast.success(`Accès réactivé pour ${u.name}.`)
          }
          return { ...u, status: nextStatus }
        }
        return u
      })
    )
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.role.toLowerCase().includes(query.toLowerCase()) ||
      u.institution.toLowerCase().includes(query.toLowerCase())
  )

  const activeCount = users.filter((u) => u.status === "Actif").length
  const analystCount = users.filter((u) => u.role === "Analyste de conformité" && u.status === "Actif").length
  const guichetCount = users.filter((u) => u.role === "Agent guichet" && u.status === "Actif").length

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-600" />
            Gestion des Utilisateurs & Habilitations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Création, modification et suspension des comptes : Analyste de conformité et Agent guichet.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <p className="text-xs font-semibold text-slate-500">Comptes configurés</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{users.length}</p>
          <p className="mt-1 text-xs text-slate-400">
            {activeCount} actif{activeCount > 1 ? "s" : ""} · {users.length - activeCount} désactivé{users.length - activeCount > 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Répartition des effectifs</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{analystCount} Analyste{analystCount > 1 ? "s" : ""}</p>
          <p className="mt-1 text-xs text-slate-400">{guichetCount} Agent{guichetCount > 1 ? "s" : ""} guichet</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Contrôle d'accès</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">Conforme BCEAO</p>
          <p className="mt-1 text-xs text-slate-400">Séparation stricte des tâches et des privilèges</p>
        </div>
      </div>

      {/* Section 1 : Registre des utilisateurs avec actions */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Utilisateurs habilités</h3>
            <p className="text-xs text-slate-500">Gestion des profils et suspension des accès en temps réel.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom, email, rôle..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Aucun utilisateur trouvé pour cette recherche.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isDeactivated = u.status === "Désactivé"
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
                      {u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("text-sm font-bold", isDeactivated ? "text-slate-500 line-through" : "text-slate-900")}>
                          {u.name}
                        </p>
                        <Badge variant="outline" className={cn("border text-2xs", roleBadgeColor[u.role])}>
                          {u.role}
                        </Badge>
                        {u.mfa && (
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
                      <p className="text-xs text-slate-400 mt-0.5">
                        {u.email} &nbsp;·&nbsp; {u.institution} &nbsp;·&nbsp; Accès : {u.lastLogin}
                      </p>
                    </div>
                  </div>

                  {/* Actions directes */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openEditModal(u)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      title="Modifier les informations"
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
                {editingUser ? "Modifier l'utilisateur" : "Créer un nouvel utilisateur"}
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
                  placeholder="Ex: Aïssata Koné"
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
                  placeholder="Ex: a.kone@sfd.ml"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rôle dans le système</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="Agent guichet">Agent guichet (Vérifications & Contrôle opérations)</option>
                  <option value="Analyste de conformité">Analyste de conformité (Instruction, Alertes & CENTIF)</option>
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
                  placeholder="Ex: SFD Bamako (Guichet 2)"
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
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 font-semibold text-white hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  {editingUser ? "Enregistrer" : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


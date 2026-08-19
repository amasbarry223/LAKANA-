"use client"

import { useState } from "react"
import { Users, Plus, MoreHorizontal, ShieldCheck, Lock, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Role = "Analyste conformité" | "Responsable conformité" | "Administrateur système" | "Auditeur" | "Agent guichet" | "Super administrateur"

type User = {
  id: string
  name: string
  email: string
  role: Role
  mfa: boolean
  status: "Actif" | "Désactivé" | "Verrouillé"
  lastLogin: string
  institution: string
}

const users: User[] = [
  { id: "USR-01", name: "Aminata Touré", email: "a.toure@sfd.ml", role: "Analyste conformité", mfa: false, status: "Actif", lastLogin: "25/08/2026 14:32", institution: "SFD Bamako" },
  { id: "USR-02", name: "Moussa Diallo", email: "m.diallo@sfd.ml", role: "Analyste conformité", mfa: false, status: "Actif", lastLogin: "25/08/2026 11:08", institution: "SFD Bamako" },
  { id: "USR-03", name: "Fatoumata Koné", email: "f.kone@sfd.ml", role: "Responsable conformité", mfa: true, status: "Actif", lastLogin: "25/08/2026 09:15", institution: "SFD Bamako" },
  { id: "USR-04", name: "Seydou Traoré", email: "s.traore@sfd.ml", role: "Administrateur système", mfa: true, status: "Actif", lastLogin: "24/08/2026 18:40", institution: "SFD Sikasso" },
  { id: "USR-05", name: "Mariam Coulibaly", email: "m.coulibaly@sfd.ml", role: "Auditeur", mfa: true, status: "Actif", lastLogin: "23/08/2026 16:22", institution: "SFD Kayes" },
  { id: "USR-06", name: "Oumar Sangaré", email: "o.sangare@sfd.ml", role: "Agent guichet", mfa: false, status: "Désactivé", lastLogin: "10/08/2026 10:00", institution: "SFD Bamako" },
  { id: "USR-07", name: "Awa Diarra", email: "a.diarra@sfd.ml", role: "Analyste conformité", mfa: false, status: "Verrouillé", lastLogin: "20/08/2026 08:30", institution: "SFD Sikasso" },
  { id: "USR-08", name: "Digi.Dev Admin", email: "admin@digidev.ml", role: "Super administrateur", mfa: true, status: "Actif", lastLogin: "25/08/2026 07:00", institution: "Multi-institutions" },
]

const roleColor: Record<Role, string> = {
  "Analyste conformité": "bg-blue-50 text-blue-700 border-blue-200",
  "Responsable conformité": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Administrateur système": "bg-violet-50 text-violet-700 border-violet-200",
  "Auditeur": "bg-slate-100 text-slate-700 border-slate-200",
  "Agent guichet": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Super administrateur": "bg-rose-50 text-rose-700 border-rose-200",
}

const statusColor: Record<User["status"], string> = {
  "Actif": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Désactivé": "bg-slate-100 text-slate-500 border-slate-200",
  "Verrouillé": "bg-rose-50 text-rose-700 border-rose-200",
}

// Matrice des droits — section 12.3
const matrix = [
  { module: "Centre d'alertes", analyste: "E", responsable: "E", admin: "—", auditeur: "L" },
  { module: "Client 360° et graphe", analyste: "L", responsable: "L", admin: "—", auditeur: "L" },
  { module: "Investigations", analyste: "E", responsable: "E", admin: "—", auditeur: "L" },
  { module: "Paramétrage du scoring", analyste: "—", responsable: "E", admin: "—", auditeur: "L" },
  { module: "Listes sanctions/PPE", analyste: "L", responsable: "E", admin: "—", auditeur: "L" },
  { module: "Gestion des utilisateurs", analyste: "—", responsable: "—", admin: "E", auditeur: "L" },
  { module: "Rapports réglementaires", analyste: "—", responsable: "E", admin: "L", auditeur: "L" },
  { module: "Journal d'audit", analyste: "—", responsable: "L", admin: "L", auditeur: "L" },
]

const accessColor: Record<string, string> = {
  "E": "bg-emerald-100 text-emerald-700",
  "L": "bg-blue-100 text-blue-700",
  "—": "bg-slate-50 text-slate-300",
}

export function UsersView() {
  const [query, setQuery] = useState("")

  const filtered = users.filter((u) =>
    !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.role.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Utilisateurs & rôles</h1>
          <p className="mt-1 text-sm text-slate-500">Gestion des comptes et contrôle d'accès RBAC (BO-01, section 12).</p>
        </div>
        <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Utilisateurs actifs", value: users.filter((u) => u.status === "Actif").length, color: "#10B981" },
          { label: "Avec MFA", value: users.filter((u) => u.mfa).length, color: "#6366F1" },
          { label: "Verrouillés", value: users.filter((u) => u.status === "Verrouillé").length, color: "#EF4444" },
          { label: "Rôles définis", value: 6, color: "#06B6D4" },
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

      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou rôle..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2.5 font-semibold">Utilisateur</th>
                <th className="px-3 py-2.5 font-semibold">Rôle</th>
                <th className="px-3 py-2.5 font-semibold">Institution</th>
                <th className="px-3 py-2.5 text-center font-semibold">MFA</th>
                <th className="px-3 py-2.5 font-semibold">Statut</th>
                <th className="px-3 py-2.5 font-semibold">Dernière connexion</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white">
                        {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={cn("border", roleColor[u.role])}>{u.role}</Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{u.institution}</td>
                  <td className="px-3 py-3 text-center">
                    {u.mfa ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600" title="MFA activé (AUTH-05)">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-300" title="MFA non activé">
                        <Lock className="h-4 w-4" />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={cn("border", statusColor[u.status])}>{u.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{u.lastLogin}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matrice des droits — section 12.3 */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900">Matrice des droits par module</h3>
          </div>
          <span className="text-xs text-slate-400">Section 12.3 — L : Lecture · E : Écriture</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-semibold">Module / Fonction</th>
                <th className="px-3 py-2 text-center font-semibold">Analyste</th>
                <th className="px-3 py-2 text-center font-semibold">Responsable</th>
                <th className="px-3 py-2 text-center font-semibold">Admin</th>
                <th className="px-3 py-2 text-center font-semibold">Auditeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {matrix.map((m) => (
                <tr key={m.module} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-4 font-medium text-slate-700">{m.module}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold", accessColor[m.analyste])}>{m.analyste}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold", accessColor[m.responsable])}>{m.responsable}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold", accessColor[m.admin])}>{m.admin}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold", accessColor[m.auditeur])}>{m.auditeur}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

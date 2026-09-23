"use client"

import { useState } from "react"
import { Users, ShieldCheck, Lock, Search, CheckCircle2, ShieldAlert, KeyRound, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Role =
  | "Analyste conformité"
  | "Responsable conformité"
  | "Administrateur système"
  | "Auditeur"
  | "Agent guichet"

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

const demoUsers: DemoUser[] = [
  { id: "USR-01", name: "Aminata Touré", email: "a.toure@sfd.ml", role: "Analyste conformité", mfa: true, status: "Actif", lastLogin: "Aujourd'hui 14:32", institution: "SFD Bamako (Agence Centrale)" },
  { id: "USR-02", name: "Moussa Diallo", email: "m.diallo@sfd.ml", role: "Analyste conformité", mfa: false, status: "Actif", lastLogin: "Aujourd'hui 11:08", institution: "SFD Bamako" },
  { id: "USR-03", name: "Fatoumata Koné", email: "f.kone@sfd.ml", role: "Responsable conformité", mfa: true, status: "Actif", lastLogin: "Aujourd'hui 09:15", institution: "SFD Bamako" },
  { id: "USR-04", name: "Seydou Traoré", email: "s.traore@sfd.ml", role: "Administrateur système", mfa: true, status: "Actif", lastLogin: "Hier 18:40", institution: "SFD Sikasso" },
  { id: "USR-05", name: "Mariam Coulibaly", email: "m.coulibaly@sfd.ml", role: "Auditeur", mfa: true, status: "Actif", lastLogin: "23/08/2026", institution: "Direction Générale SFD" },
  { id: "USR-06", name: "Oumar Sangaré", email: "o.sangare@sfd.ml", role: "Agent guichet", mfa: false, status: "Désactivé", lastLogin: "10/08/2026", institution: "SFD Kayes" },
]

const roleBadgeColor: Record<Role, string> = {
  "Analyste conformité": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Responsable conformité": "bg-purple-50 text-purple-700 border-purple-200",
  "Administrateur système": "bg-rose-50 text-rose-700 border-rose-200",
  "Auditeur": "bg-slate-100 text-slate-700 border-slate-200",
  "Agent guichet": "bg-amber-50 text-amber-700 border-amber-200",
}

// Matrice réglementaire des droits (Cahier des charges — Section 12.3)
const rbacMatrix = [
  { module: "Centre d'alertes & Traitement", analyste: "Écriture", responsable: "Écriture", admin: "—", auditeur: "Lecture" },
  { module: "Client 360° & Graphe relationnel", analyste: "Lecture", responsable: "Lecture", admin: "—", auditeur: "Lecture" },
  { module: "Dossiers d'investigation (STR/CENTIF)", analyste: "Écriture", responsable: "Validation finale", admin: "—", auditeur: "Lecture" },
  { module: "Filtrage Sanctions & Listes PPE", analyste: "Lecture", responsable: "Écriture", admin: "—", auditeur: "Lecture" },
  { module: "Rapports réglementaires BCEAO/CENTIF", analyste: "—", responsable: "Écriture & Export", admin: "Lecture", auditeur: "Lecture" },
  { module: "Journal d'audit & Traçabilité SHA-256", analyste: "—", responsable: "Lecture", admin: "Lecture", auditeur: "Lecture complète" },
  { module: "Paramètres & Seuils réglementaires", analyste: "—", responsable: "Écriture", admin: "Écriture", auditeur: "Lecture" },
]

export function UsersView() {
  const [query, setQuery] = useState("")

  const filteredUsers = demoUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.role.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-indigo-600" />
            Utilisateurs & Matrice RBAC
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Contrôle d'accès basé sur les rôles, séparation des tâches et habilitations LBC/FT (Module 12.3).
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          Conforme Instruction BCEAO n°003-03-2025
        </span>
      </div>

      {/* Cartes d'indicateurs de gouvernance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Comptes configurés</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{demoUsers.length}</p>
          <p className="mt-1 text-xs text-slate-400">5 comptes actifs · 1 désactivé</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">MFA / Double facteur</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">80%</p>
          <p className="mt-1 text-xs text-slate-400">Obligatoire pour Responsable & Admin</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Séparation des tâches</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">Strict</p>
          <p className="mt-1 text-xs text-slate-400">L'admin technique n'instruit pas d'alerte</p>
        </div>
      </div>

      {/* Section 1 : Matrice officielle des droits d'accès (RBAC) */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-4 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Matrice réglementaire des privilèges (Section 12.3)</h3>
            <p className="text-xs text-slate-500">Droits d'accès par rôle et par module métier de conformité.</p>
          </div>
          <Badge variant="outline" className="border-slate-200 bg-white text-2xs text-slate-600">
            Politique de moindre privilège
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Module Métier</th>
                <th className="py-3 px-4">Analyste LBC/FT</th>
                <th className="py-3 px-4">Responsable Conformité</th>
                <th className="py-3 px-4">Administrateur</th>
                <th className="py-3 px-4">Auditeur Interne/BCEAO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rbacMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{row.module}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold",
                      row.analyste.includes("Écriture") ? "bg-emerald-100 text-emerald-800" :
                      row.analyste.includes("Lecture") ? "bg-indigo-100 text-indigo-800" : "text-slate-400"
                    )}>
                      {row.analyste}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold",
                      row.responsable.includes("Écriture") || row.responsable.includes("Validation") ? "bg-purple-100 text-purple-800" :
                      row.responsable.includes("Lecture") ? "bg-indigo-100 text-indigo-800" : "text-slate-400"
                    )}>
                      {row.responsable}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold",
                      row.admin.includes("Écriture") ? "bg-rose-100 text-rose-800" :
                      row.admin.includes("Lecture") ? "bg-indigo-100 text-indigo-800" : "text-slate-400"
                    )}>
                      {row.admin}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700">
                      {row.auditeur}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2 : Registre des profils et utilisateurs */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Comptes et affectations institutionnelles</h3>
            <p className="text-xs text-slate-500">Utilisateurs habilités sur la plateforme pour le SFD.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom, rôle..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none focus:border-indigo-400 focus:bg-white"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.map((u) => (
            <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600 text-xs">
                  {u.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{u.name}</p>
                    <Badge variant="outline" className={cn("border text-2xs", roleBadgeColor[u.role])}>
                      {u.role}
                    </Badge>
                    {u.mfa && (
                      <span className="inline-flex items-center gap-0.5 text-2xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        <KeyRound className="h-2.5 w-2.5" />
                        MFA actif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {u.email} &nbsp;·&nbsp; {u.institution} &nbsp;·&nbsp; Dernier accès : {u.lastLogin}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-semibold",
                  u.status === "Actif" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", u.status === "Actif" ? "bg-emerald-500" : "bg-slate-400")} />
                  {u.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

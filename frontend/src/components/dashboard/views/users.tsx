"use client"

import { useState } from "react"
import { Users, ShieldCheck, Search, KeyRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

const demoUsers: DemoUser[] = [
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
  { module: "Centre d'alertes & Traitement", analyste: "Écriture & Traitement", guichet: "Consultation" },
  { module: "Contrôle & Pré-filtrage Sociétaire", analyste: "Contrôle approfondi", guichet: "Pré-filtrage & Signalement" },
  { module: "Client 360° & Graphe relationnel", analyste: "Analyse intégrale", guichet: "Consultation simplifiée" },
  { module: "Dossiers d'investigation (STR/CENTIF)", analyste: "Instruction & Clôture", guichet: "—" },
  { module: "Filtrage Sanctions & Listes PPE", analyste: "Contrôle & Validation", guichet: "Vérification guichet" },
  { module: "Rapports réglementaires BCEAO/CENTIF", analyste: "Génération & Export", guichet: "—" },
  { module: "Journal d'audit & Traçabilité SHA-256", analyste: "Consultation intégrale", guichet: "—" },
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
            Utilisateurs & Rôles
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestion des profils et contrôle d'accès : Analyste de conformité et Agent guichet.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          Conforme Instruction BCEAO n°003-03-2025
        </span>
      </div>

      {/* Indicateurs de gouvernance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Comptes configurés</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{demoUsers.length}</p>
          <p className="mt-1 text-xs text-slate-400">2 Analystes · 2 Agents guichet</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">MFA / Double facteur</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">Actif</p>
          <p className="mt-1 text-xs text-slate-400">Sécurité renforcée sur les accès conformité</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">Rôles autorisés</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">2 Rôles</p>
          <p className="mt-1 text-xs text-slate-400">Analyste de conformité & Agent guichet</p>
        </div>
      </div>

      {/* Section 1 : Matrice des droits d'accès */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-4 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Matrice des privilèges d'accès</h3>
            <p className="text-xs text-slate-500">Séparation stricte des habilitations par rôle.</p>
          </div>
          <Badge variant="outline" className="border-slate-200 bg-white text-2xs text-slate-600">
            2 profils métier
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
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold",
                      row.analyste.includes("Écriture") || row.analyste.includes("Instruction") || row.analyste.includes("Contrôle") || row.analyste.includes("Génération") ? "bg-emerald-100 text-emerald-800" :
                      row.analyste.includes("Analyse") || row.analyste.includes("Consultation") ? "bg-indigo-100 text-indigo-800" : "text-slate-400"
                    )}>
                      {row.analyste}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold",
                      row.guichet.includes("Pré-filtrage") || row.guichet.includes("Vérification") ? "bg-amber-100 text-amber-800" :
                      row.guichet.includes("Consultation") ? "bg-slate-100 text-slate-700" : "text-slate-300"
                    )}>
                      {row.guichet}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2 : Registre des utilisateurs */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Comptes et affectations</h3>
            <p className="text-xs text-slate-500">Utilisateurs habilités sur la plateforme.</p>
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

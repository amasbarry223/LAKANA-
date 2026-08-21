"use client"

import { UserCircle, ShieldCheck, Lock, Settings, LogOut, Mail, Building2, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { navigateTo } from "@/lib/navigate"
import { useDashboard } from "@/lib/dashboard-context"

export function ProfileView({ onLogout }: { onLogout?: () => void }) {
  const { userName, userRole } = useDashboard()

  const mfaEnabled =
    userRole === "Responsable conformité" ||
    userRole === "Administrateur système" ||
    userRole === "Auditeur (lecture seule)"

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Mon profil</h1>
        <p className="mt-1 text-sm text-slate-500">Informations du compte connecté et préférences de session.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xl font-bold text-white">
            {userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-slate-900">{userName}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{userRole}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                Session active
              </Badge>
              {mfaEnabled ? (
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  MFA activé
                </Badge>
              ) : (
                <Badge variant="outline" className="border-slate-200 text-slate-500 gap-1">
                  <Lock className="h-3 w-3" />
                  MFA non activé
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Mail className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-800">
                {userName.toLowerCase().replace(" ", ".")}@sfd.ml
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Building2 className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Institution</p>
              <p className="text-sm font-medium text-slate-800">SFD Bamako</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Clock className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Dernière connexion</p>
              <p className="text-sm font-medium text-slate-800">25/08/2026 14:32</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <UserCircle className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Identifiant</p>
              <p className="text-sm font-medium text-slate-800">AUTH-01 · JWT</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigateTo("Paramètres")}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Settings className="h-4 w-4" />
          Paramètres
        </button>
        <button
          onClick={onLogout}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>

      <p className="text-center text-[11px] text-slate-400">
        Déconnexion automatique après inactivité (AUTH-07) · Chaque accès est journalisé (AUTH-08)
      </p>
    </div>
  )
}

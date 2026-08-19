"use client"

import { useState } from "react"
import { ShieldAlert, Eye, EyeOff, Lock, User, ShieldCheck, AlertCircle, KeyRound, Mail, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const roles = [
  { value: "analyste", label: "Analyste conformité", mfa: false },
  { value: "responsable", label: "Responsable conformité", mfa: true },
  { value: "admin", label: "Administrateur système", mfa: true },
  { value: "auditeur", label: "Auditeur (lecture seule)", mfa: true },
]

export function LoginScreen({ onLogin }: { onLogin: (role: string) => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [role, setRole] = useState("analyste")
  const [step, setStep] = useState<"login" | "mfa">("login")
  const [mfaCode, setMfaCode] = useState("")
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")

  const selectedRole = roles.find((r) => r.value === role)!

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!username || !password) {
      setError("Veuillez renseigner tous les champs.")
      return
    }
    if (password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères (AUTH-03).")
      return
    }
    // Simulated auth — always succeeds for demo
    if (selectedRole.mfa) {
      setStep("mfa")
    } else {
      onLogin(selectedRole.label)
    }
  }

  const handleMfa = (e: React.FormEvent) => {
    e.preventDefault()
    if (mfaCode.length !== 6) {
      setError("Le code MFA doit comporter 6 chiffres (AUTH-05).")
      return
    }
    onLogin(selectedRole.label)
  }

  const failAttempt = () => {
    setAttempts((a) => a + 1)
    setError(`Tentative échouée. ${5 - attempts - 1} restantes avant verrouillage (AUTH-04).`)
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      return
    }
    toast.success("Demande envoyée", {
      description: "Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé (AUTH-09).",
    })
    setForgotEmail("")
    setForgotOpen(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-violet-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">LAKANA</h1>
          <p className="text-xs font-medium text-slate-400">le bouclier — conformité LBC/FT/FP</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          {step === "login" ? (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Connexion</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Authentification requise avant tout accès (AUTH-01).
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Identifiant</label>
                  <div className="relative mt-1">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="a.toure@sfd.ml"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Mot de passe</label>
                  <div className="relative mt-1">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Role selector */}
                <div>
                  <label className="text-xs font-medium text-slate-600">Rôle</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}{r.mfa ? " (MFA requis)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.99]"
                >
                  {selectedRole.mfa ? "Continuer vers MFA" : "Se connecter"}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  Mot de passe oublié ? (AUTH-09)
                </button>
                <span className="text-slate-400">Session JWT (AUTH-06)</span>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Mots de passe hachés (bcrypt). Journalisation de chaque tentative (AUTH-08).
              </div>
            </>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Authentification à deux facteurs</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Saisissez le code à 6 chiffres de votre application (AUTH-05).
                </p>
              </div>

              <form onSubmit={handleMfa} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600">Code MFA</label>
                  <div className="relative mt-1">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      inputMode="numeric"
                      className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-center text-lg font-mono tracking-[0.3em] outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.99]"
                >
                  Valider et accéder
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("login"); setMfaCode(""); setError("") }}
                  className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  ← Retour
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Déconnexion automatique après inactivité (AUTH-07) · © Digi.Dev — Hackathon CIF 2026
        </p>
      </div>

      {/* Forgot password dialog (AUTH-09) */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setForgotOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Mail className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Mot de passe oublié</h2>
                  <p className="text-[11px] text-slate-400">Réinitialisation (AUTH-09)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleForgotSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600">Adresse e-mail</label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="a.toure@sfd.ml"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Si un compte existe pour cette adresse, un lien de réinitialisation vous sera envoyé.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Envoyer la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

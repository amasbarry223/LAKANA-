"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Eye, EyeOff, Lock, User, ShieldCheck, AlertCircle, KeyRound, Mail, X, Clock } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const roles = [
  { value: "analyste", label: "Analyste conformité", mfa: false },
  { value: "responsable", label: "Responsable conformité", mfa: true },
  { value: "admin", label: "Administrateur système", mfa: true },
  { value: "auditeur", label: "Auditeur (lecture seule)", mfa: true },
]

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 60

export function LoginScreen({ onLogin }: { onLogin: (role: string) => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [role, setRole] = useState("analyste")
  const [step, setStep] = useState<"login" | "mfa">("login")
  const [mfaCode, setMfaCode] = useState("")
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)

  const selectedRole = roles.find((r) => r.value === role)!

  // Lockout countdown timer (AUTH-04)
  useEffect(() => {
    if (!locked) return
    const timer = setInterval(() => {
      setLockoutRemaining((s) => {
        if (s <= 1) {
          setLocked(false)
          setAttempts(0)
          setError("")
          toast.success("Compte déverrouillé", { description: "Vous pouvez réessayer de vous connecter." })
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [locked])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (locked) return
    if (!username || !password) {
      setError("Veuillez renseigner tous les champs.")
      return
    }
    if (password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères (AUTH-03).")
      return
    }

    // Simulated auth: password "wrongpass" or "incorrect" triggers a failed attempt (AUTH-04 demo)
    if (password.toLowerCase() === "wrongpass" || password.toLowerCase() === "incorrect") {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true)
        setLockoutRemaining(LOCKOUT_SECONDS)
        setError(`Compte verrouillé après ${MAX_ATTEMPTS} tentatives échouées (AUTH-04). Réessayez dans ${LOCKOUT_SECONDS}s.`)
        toast.error("Compte verrouillé", { description: `Verrouillage temporaire ${LOCKOUT_SECONDS}s (AUTH-04).` })
      } else {
        setError(`Identifiants incorrects. ${MAX_ATTEMPTS - newAttempts} tentative(s) restante(s) avant verrouillage (AUTH-04).`)
      }
      return
    }

    // Success — proceed to MFA or login
    if (selectedRole.mfa) {
      setStep("mfa")
      toast.info("Code MFA requis", { description: `Un code a été envoyé pour ${selectedRole.label} (AUTH-05).` })
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
    // Any 6-digit code works for demo, except 000000 which fails
    if (mfaCode === "000000") {
      setError("Code MFA invalide. Vérifiez votre application d'authentification.")
      return
    }
    onLogin(selectedRole.label)
  }

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim() || !resetEmail.includes("@")) {
      toast.error("Email invalide", { description: "Veuillez saisir une adresse email valide." })
      return
    }
    setResetSent(true)
    toast.success("Demande envoyée", { description: "Si ce compte existe, un email de réinitialisation a été envoyé (AUTH-09)." })
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

              {/* Lockout banner */}
              {locked && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700">
                  <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                  <span>Compte verrouillé. Réessayez dans <strong>{lockoutRemaining}s</strong> (AUTH-04).</span>
                </div>
              )}

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
                      disabled={locked}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
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
                      disabled={locked}
                      className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
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
                    disabled={locked}
                    className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}{r.mfa ? " (MFA requis)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Attempts indicator */}
                {attempts > 0 && !locked && (
                  <div className="flex items-center gap-2">
                    {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i < attempts ? "bg-rose-400" : "bg-slate-200"
                        )}
                      />
                    ))}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={locked}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {locked ? "Compte verrouillé" : selectedRole.mfa ? "Continuer vers MFA" : "Se connecter"}
                </button>
              </form>

              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setResetOpen(true); setResetSent(false); setResetEmail("") }}
                  className="cursor-pointer font-medium text-indigo-600 hover:underline"
                >
                  Mot de passe oublié ? (AUTH-09)
                </button>
                <span className="text-slate-400">Session JWT (AUTH-06)</span>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                Mots de passe hachés (bcrypt). Journalisation de chaque tentative (AUTH-08).
              </div>

              {/* Demo hint */}
              <div className="mt-3 rounded-lg bg-indigo-50/50 px-3 py-2 text-[11px] text-indigo-600">
                <strong>Démo :</strong> utilisez le mot de passe <code className="rounded bg-white px-1 font-mono">password123</code> pour réussir, ou <code className="rounded bg-white px-1 font-mono">wrongpass</code> pour simuler un échec et tester le verrouillage (AUTH-04).
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
                      autoFocus
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

              <div className="mt-3 rounded-lg bg-indigo-50/50 px-3 py-2 text-[11px] text-indigo-600">
                <strong>Démo :</strong> n'importe quel code à 6 chiffres fonctionne, sauf <code className="rounded bg-white px-1 font-mono">000000</code>.
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Déconnexion automatique après inactivité (AUTH-07) · © Digi.Dev — Hackathon CIF 2026
        </p>
      </div>

      {/* Password reset modal (AUTH-09) */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setResetOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Mail className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Réinitialisation mot de passe</h3>
              </div>
              <button onClick={() => setResetOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-700">Demande envoyée</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Si un compte existe pour <strong>{resetEmail}</strong>, un email de réinitialisation a été envoyé. Aucune information sur l'existence du compte n'est divulguée (AUTH-09).
                  </p>
                </div>
                <button
                  onClick={() => setResetOpen(false)}
                  className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="mt-5 space-y-4">
                <p className="text-xs text-slate-500">
                  Saisissez votre adresse email. Un lien sécurisé de réinitialisation sera envoyé sans divulguer d'information sur l'existence du compte (AUTH-09).
                </p>
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="a.toure@sfd.ml"
                    autoFocus
                    className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResetOpen(false)}
                    className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Envoyer le lien
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

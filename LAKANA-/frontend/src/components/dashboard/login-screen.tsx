"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Mail,
  X,
  Clock,
  Loader2,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const MAX_ATTEMPTS = 5
const LOCKOUT_SECONDS = 60

export function LoginScreen({ onLogin }: { onLogin: (role: string) => void }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState("analyste@lakana.ml")
  const [password, setPassword] = useState("password123")

  useEffect(() => {
    setMounted(true)
  }, [])
  const [rememberMe, setRememberMe] = useState(true)
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"login" | "mfa">("login")
  const [mfaCode, setMfaCode] = useState("")
  const [error, setError] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)

  // Lockout countdown timer
  useEffect(() => {
    if (!locked) return
    const timer = setInterval(() => {
      setLockoutRemaining((s) => {
        if (s <= 1) {
          setLocked(false)
          setAttempts(0)
          setError("")
          toast.success("Compte déverrouillé", {
            description: "Vous pouvez réessayer de vous connecter.",
          })
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [locked])

  // Keyboard navigation: Escape key closes reset modal
  useEffect(() => {
    if (!resetOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setResetOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [resetOpen])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (locked || loading) return

    if (!username.trim() || !password) {
      setError("Veuillez renseigner votre identifiant et votre mot de passe.")
      return
    }

    if (password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.")
      return
    }

    // Simulated auth: password "wrongpass" or "incorrect" triggers a failed attempt
    if (password.toLowerCase() === "wrongpass" || password.toLowerCase() === "incorrect") {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= MAX_ATTEMPTS) {
        setLocked(true)
        setLockoutRemaining(LOCKOUT_SECONDS)
        setError(`Compte temporairement verrouillé après ${MAX_ATTEMPTS} tentatives échouées. Réessayez dans ${LOCKOUT_SECONDS}s.`)
        toast.error("Compte verrouillé", {
          description: `Sécurité activée : attente requise de ${LOCKOUT_SECONDS}s.`,
        })
      } else {
        setError(`Identifiants non reconnus. ${MAX_ATTEMPTS - newAttempts} tentative(s) restante(s).`)
      }
      return
    }

    // Determine role based on username/email
    const lowerUser = username.toLowerCase()
    const resolvedRole =
      lowerUser.includes("guichet") || lowerUser.includes("diarra") || lowerUser.includes("agent")
        ? "Agent de guichet"
        : "Analyste conformité"

    // Snappy loading animation for professional feedback
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin(resolvedRole)
      toast.success("Connexion réussie", {
        description: `Session ouverte en tant que ${resolvedRole}.`,
      })
    }, 450)
  }

  const handleMfa = (e: React.FormEvent) => {
    e.preventDefault()
    if (mfaCode.length !== 6) {
      setError("Le code MFA doit comporter 6 chiffres.")
      return
    }
    if (mfaCode === "000000") {
      setError("Code MFA invalide. Vérifiez votre application d'authentification.")
      return
    }

    const resolvedRole =
      username.toLowerCase().includes("guichet") || username.toLowerCase().includes("diarra")
        ? "Agent de guichet"
        : "Analyste conformité"

    onLogin(resolvedRole)
  }

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim() || !resetEmail.includes("@")) {
      toast.error("Email invalide", {
        description: "Veuillez saisir une adresse email professionnelle valide.",
      })
      return
    }
    setResetSent(true)
    toast.success("Demande enregistrée", {
      description: "Si ce compte est actif, les instructions de réinitialisation ont été transmises.",
    })
  }

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat p-4 sm:p-6"
      style={{ backgroundImage: "url('/bg1.jpg')" }}
    >
      {/* Dégradé doux et lumineux : préserve la visibilité et les couleurs de l'arrière-plan bg1.jpg */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-slate-950/40 via-slate-900/25 to-indigo-950/30 backdrop-blur-[0.5px]"
        aria-hidden="true"
      />

      {/* Vignette radiale subtile pour recentrer le regard vers le centre */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(15,23,42,0.35)_100%)]"
        aria-hidden="true"
      />

      {/* Orbes lumineux d'ambiance animés en arrière-plan */}
      <div
        className="pointer-events-none absolute -top-28 -left-28 h-[400px] w-[400px] rounded-full bg-indigo-500/25 blur-3xl animate-pulse"
        style={{ animationDuration: "6s" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[440px] w-[440px] rounded-full bg-blue-500/20 blur-3xl animate-pulse"
        style={{ animationDuration: "7s", animationDelay: "1.5s" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]"
        aria-hidden="true"
      />

      {/* Bouton de bascule Mode Sombre / Clair sur l'écran de connexion */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/20 backdrop-blur-md text-white shadow-lg transition hover:bg-white/30 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-900/80 cursor-pointer"
          title={mounted && theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          aria-label="Basculer le thème"
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
          ) : (
            <Moon className="h-5 w-5 text-white transition-transform duration-200 hover:-rotate-12" />
          )}
        </button>
      </div>

      {/* Conteneur principal centré au milieu avec verre dépoli lumineux */}
      <div className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/70 bg-white/88 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] backdrop-blur-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] dark:ring-white/10 animate-in fade-in-50 zoom-in-95 slide-in-from-bottom-3 duration-500">
        {/* En-tête avec logo officiel proéminent et épuré */}
        <div className="flex flex-col items-center px-8 pt-7 pb-5 text-center border-b border-slate-100/90 bg-gradient-to-b from-white/95 to-slate-50/60 dark:border-slate-800 dark:from-slate-900/95 dark:to-slate-950/80">
          <div className="mb-4 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="LAKANA"
              className="h-32 w-auto max-w-[260px] object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
            />
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Portail de conformité LBC/FT • Surveillance SFD
          </p>
        </div>

        {/* Corps du formulaire */}
        <div className="px-8 py-6">
          {step === "login" ? (
            <>
              {/* Alerte de compte verrouillé */}
              {locked && (
                <div
                  role="alert"
                  className="mb-4 flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700 shadow-2xs animate-in fade-in duration-200"
                >
                  <Clock className="h-4 w-4 shrink-0 animate-pulse text-rose-600" />
                  <span>
                    Compte verrouillé. Réessayez dans <strong>{lockoutRemaining}s</strong>.
                  </span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Identifiant ou Email */}
                <div>
                  <label htmlFor="login-username" className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Identifiant professionnel
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors" />
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        if (error) setError("")
                      }}
                      placeholder="nom.prenom@institution.ml"
                      disabled={locked || loading}
                      aria-invalid={!!error}
                      aria-describedby={error ? "login-error-alert" : undefined}
                      className="h-11 w-full rounded-xl border border-slate-200/90 bg-white/90 pl-10 pr-3.5 text-sm text-slate-800 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetOpen(true)
                        setResetSent(false)
                        setResetEmail("")
                      }}
                      className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors" />
                    <input
                      id="login-password"
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (error) setError("")
                      }}
                      placeholder="••••••••••••"
                      disabled={locked || loading}
                      aria-invalid={!!error}
                      aria-describedby={error ? "login-error-alert" : undefined}
                      className="h-11 w-full rounded-xl border border-slate-200/90 bg-white/90 pl-10 pr-11 text-sm text-slate-800 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Se souvenir de moi */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={locked || loading}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-medium">Se souvenir de cet appareil</span>
                  </label>
                </div>

                {/* Indicateur visuel de tentatives restantes */}
                {attempts > 0 && !locked && (
                  <div
                    className="flex items-center gap-1.5 pt-1"
                    aria-label={`Tentatives échouées : ${attempts} sur ${MAX_ATTEMPTS}`}
                  >
                    {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-all",
                          i < attempts ? "bg-rose-500" : "bg-slate-200"
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Message d'erreur */}
                {error && (
                  <div
                    id="login-error-alert"
                    role="alert"
                    className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-3.5 py-2.5 text-xs text-rose-700 shadow-2xs animate-in fade-in duration-200"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Bouton de soumission principal avec état de chargement */}
                <button
                  type="submit"
                  disabled={locked || loading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:shadow-indigo-600/45 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>{locked ? "Compte temporairement verrouillé" : "Se connecter"}</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-0.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                {/* Accès rapide démonstration jury */}
                <div className="pt-2 text-center">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Accès rapide démonstration
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onLogin("Analyste conformité")}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-indigo-950/40 dark:hover:border-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
                    >
                      🛡️ Analyste LBC
                    </button>
                    <button
                      type="button"
                      onClick={() => onLogin("Agent de guichet")}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                    >
                      🏦 Agent Guichet
                    </button>
                  </div>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Étape MFA */}
              <div className="mb-4 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Double Authentification (MFA)</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Saisissez le code de validation sécurisé à 6 chiffres.
                </p>
              </div>

              <form onSubmit={handleMfa} className="space-y-4">
                <div>
                  <label htmlFor="login-mfa" className="text-xs font-semibold text-slate-700 block mb-1.5 text-center">
                    Code d'authentification
                  </label>
                  <input
                    id="login-mfa"
                    value={mfaCode}
                    onChange={(e) => {
                      setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      if (error) setError("")
                    }}
                    placeholder="000 000"
                    inputMode="numeric"
                    autoFocus
                    aria-invalid={!!error}
                    aria-describedby={error ? "mfa-error-alert" : undefined}
                    className="h-12 w-full rounded-xl border border-slate-200/90 bg-white/90 px-4 text-center text-lg font-mono font-bold tracking-[0.35em] text-slate-800 shadow-2xs outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                  />
                </div>

                {error && (
                  <div
                    id="mfa-error-alert"
                    role="alert"
                    className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-3.5 py-2.5 text-xs text-rose-700 shadow-2xs"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Valider et accéder
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("login")
                    setMfaCode("")
                    setError("")
                  }}
                  className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  ← Retour à la connexion
                </button>
              </form>
            </>
          )}
        </div>

        {/* Pied de carte sécurisé */}
        <div className="border-t border-slate-100 bg-slate-50/70 px-8 py-3 text-center">
          <p className="text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3 text-slate-400" />
            <span>Chiffrement SSL/TLS • Directives CENTIF / UEMOA</span>
          </p>
        </div>
      </div>

      {/* Boîte de dialogue de réinitialisation de mot de passe */}
      {resetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setResetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            aria-describedby="reset-modal-desc"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Mail className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 id="reset-modal-title" className="text-lg font-semibold text-slate-900">
                  Réinitialisation mot de passe
                </h3>
              </div>
              <button
                onClick={() => setResetOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 cursor-pointer transition"
                aria-label="Fermer la boîte de dialogue"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-800">Lien de réinitialisation transmis</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Si un compte correspond à <strong>{resetEmail}</strong>, un courrier sécurisé contenant les instructions a été envoyé.
                  </p>
                </div>
                <button
                  onClick={() => setResetOpen(false)}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="mt-5 space-y-4">
                <p id="reset-modal-desc" className="text-xs text-slate-500">
                  Saisissez votre adresse email professionnelle. Un lien sécurisé temporaire vous sera expédié.
                </p>
                <div>
                  <label htmlFor="reset-email" className="text-xs font-medium text-slate-700">
                    Email professionnel
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="analyste@institution.ml"
                    autoFocus
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition cursor-pointer"
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

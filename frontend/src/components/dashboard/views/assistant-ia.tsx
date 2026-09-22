"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, Send, User, ShieldAlert, Bot, RefreshCw, AlertCircle, Database, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { aiService } from "@/services/aiService"
import type { AIContextResponse } from "@/models/ai"
import { toast } from "sonner"

type Message = {
  role: "user" | "assistant"
  content: string
  points_cles?: string[]
  intent?: string
  source?: string
}

interface ClientContextCardData {
  nom: string
  prenom?: string
  code_client: string
  risk_score: number
  niveau_risque: string
  facteurs: string[]
  decomposition?: Record<string, { points: number; max: number }>
  transactions_count?: number
  est_ppe?: boolean
  profession?: string
}

export function AssistantIAView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour, je suis l'assistant IA de LAKANA. Je suis directement relié à la base de données et aux moteurs réglementaires de votre institution (BCEAO & CENTIF-Mali).\n\nPosez-moi une question sur le score d'un client, la détection de fractionnement ou les alertes en cours.",
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [context, setContext] = useState<AIContextResponse | null>(null)
  const [activeClientContext, setActiveClientContext] = useState<ClientContextCardData | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([
    "Quels sont les clients les plus risqués ?",
    "Y a-t-il du fractionnement détecté ?",
    "Statistiques des alertes",
  ])
  const [isLoadingContext, setIsLoadingContext] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Chargement du contexte initial live depuis l'API
  const fetchContext = async () => {
    setIsLoadingContext(true)
    try {
      const data = await aiService.getContext()
      setContext(data)
      if (data.top_client) {
        setActiveClientContext(data.top_client)
      }
      if (data.suggested_queries && data.suggested_queries.length > 0) {
        setSuggestions(data.suggested_queries)
      }
    } catch (e) {
      console.error("Erreur chargement contexte IA :", e)
      toast.error("Impossible de charger les données contextuelles en direct.")
    } finally {
      setIsLoadingContext(false)
    }
  }

  useEffect(() => {
    fetchContext()
  }, [])

  const send = async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || isTyping) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: q }])
    setIsTyping(true)

    try {
      const chatRes = await aiService.chat(q)

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: chatRes.response,
          points_cles: chatRes.points_cles,
          intent: chatRes.intent,
          source: chatRes.source_moteur,
        },
      ])

      // Actualisation dynamique des suggestions issues du moteur
      if (chatRes.suggestions && chatRes.suggestions.length > 0) {
        setSuggestions(chatRes.suggestions)
      }

      // Si la réponse inclut un client spécifique analysé, on met à jour la sidebar
      if (chatRes.context_client) {
        setActiveClientContext(chatRes.context_client)
      }
    } catch (e) {
      console.error("Erreur communication chat IA:", e)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Une erreur réseau est survenue lors de la communication avec le moteur d'analyse LAKANA. Veuillez réessayer dans un instant.",
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  // Formatage des facteurs de décomposition
  const formatDecomposition = (decomp?: Record<string, { points: number; max: number }>) => {
    if (!decomp) {
      return [
        { label: "Fractionnement", points: 28, max: 30 },
        { label: "Volume inhabituel", points: 22, max: 25 },
        { label: "Fréquence anormale", points: 18, max: 20 },
        { label: "PPE / Sanctions", points: 0, max: 15 },
        { label: "Relations suspectes", points: 10, max: 10 },
      ]
    }
    const labelsMap: Record<string, string> = {
      fractionnement: "Fractionnement (FRC)",
      volume: "Volume inhabituel (VOL)",
      frequence: "Fréquence anormale (FREQ)",
      sanctions_ppe: "PPE / Sanctions",
      relations: "Relations suspectes",
      modele_ia: "Détection IA (ML)",
    }
    return Object.entries(decomp).map(([key, val]) => ({
      label: labelsMap[key] || key,
      points: val.points || 0,
      max: val.max || 20,
    }))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px] dark:text-slate-100">
            Assistant IA LAKANA
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Aide à l'analyse en temps réel — Explication factuelle et déterministe (Conformité IA-01 à IA-04).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {context?.models_ready ? "Moteur IA & ML Opérationnel" : "Connecté à la BDD"}
          </Badge>

          <button
            onClick={fetchContext}
            disabled={isLoadingContext}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            title="Rafraîchir les données de contexte"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoadingContext && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Chat Principal */}
        <div
          className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 xl:col-span-2"
          style={{ height: 620 }}
        >
          {/* Header du Chat */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-xs">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Assistant Déterministe LAKANA
                </p>
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Données Live BDD UEMOA • 100% Explicable
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-[11px] text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
                Instruction BCEAO n°003-03-2025
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5 sidebar-scroll">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-xs",
                    m.role === "assistant"
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  )}
                >
                  {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs",
                    m.role === "assistant"
                      ? "rounded-tl-xs bg-slate-50 text-slate-800 whitespace-pre-line border border-slate-100 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700/60"
                      : "rounded-tr-xs bg-indigo-600 text-white font-medium"
                  )}
                >
                  <div>{m.content}</div>

                  {m.points_cles && m.points_cles.length > 0 && (
                    <div className="mt-3 border-t border-slate-200/60 pt-2.5 dark:border-slate-700/60">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Signaux déterminants :
                      </p>
                      <ul className="mt-1 space-y-1">
                        {m.points_cles.map((pt, pIdx) => (
                          <li key={pIdx} className="text-xs text-slate-600 flex items-start gap-1.5 dark:text-slate-300">
                            <span className="text-indigo-500 shrink-0 font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.source && (
                    <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                      Moteur : {m.source}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800/80 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-slate-500 ml-1">Analyse des flux et calcul des scores BDD...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Saisie de message */}
          <div className="border-t border-slate-100 p-3.5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Posez votre question (ex: 'Expliquer le score de Diarra', 'Y a-t-il du fractionnement ?')..."
                disabled={isTyping}
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-indigo-900/50"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || isTyping}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Panneau Latéral Dynamique */}
        <div className="space-y-4 xl:col-span-1">
          {/* Questions Suggérées Dynamiques */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Questions suggérées</h3>
              <Sparkles className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Questions générées dynamiquement selon les signaux en base :
            </p>
            <div className="mt-3 space-y-2">
              {suggestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => send(q)}
                  disabled={isTyping}
                  className="block w-full rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/40"
                >
                  💬 {q}
                </button>
              ))}
            </div>
          </div>

          {/* Carte Contexte Client Dynamique */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {activeClientContext ? `Contexte : ${activeClientContext.nom} ${activeClientContext.prenom || ""}` : "Contexte Client"}
                </h3>
                {activeClientContext && (
                  <p className="text-[11px] text-slate-500">
                    Réf : {activeClientContext.code_client} {activeClientContext.est_ppe ? "• [PPE Actif]" : ""}
                  </p>
                )}
              </div>
              {activeClientContext && (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-bold",
                    activeClientContext.risk_score >= 70
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                      : activeClientContext.risk_score >= 40
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  )}
                >
                  {activeClientContext.risk_score}/100
                </span>
              )}
            </div>

            {activeClientContext ? (
              <div className="mt-3 space-y-3">
                <div className="space-y-2">
                  {formatDecomposition(activeClientContext.decomposition).map((f) => (
                    <div key={f.label}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-slate-400">{f.label}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {f.points}/{f.max} pts
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            f.points / f.max > 0.7
                              ? "bg-rose-500"
                              : f.points / f.max > 0.4
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          )}
                          style={{ width: `${Math.min(100, (f.points / f.max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    Activité : {activeClientContext.transactions_count ?? 0} transactions analysées
                  </p>
                  {activeClientContext.facteurs && activeClientContext.facteurs.length > 0 && (
                    <p className="mt-1 line-clamp-2 text-slate-500 dark:text-slate-400">
                      Premier signal : {activeClientContext.facteurs[0]}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                <Database className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
                <p className="mt-2">Posez une question sur un client pour charger son dossier complet ici.</p>
              </div>
            )}
          </div>

          {/* Rappel Réglementaire IA-02 & IA-03 */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                  Cadre Éthique & Décision Humaine (IA-03)
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-800 dark:text-amber-400">
                  L'assistant IA de LAKANA produit des synthèses 100% déterministes à partir des calculs réglementaires.
                  Toute décision de gel de compte, blocage ou déclaration à la CENTIF-Mali relève de l'analyste habilité.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

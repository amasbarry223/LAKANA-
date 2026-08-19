"use client"

import { useState } from "react"
import { Sparkles, Send, User, ShieldAlert, Info, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Message = {
  role: "user" | "assistant"
  content: string
}

// Réponses pré-définies fondées sur les facteurs déjà calculés (IA-02)
const presets = [
  { q: "Expliquer le score de Traoré, Moussa", a: "Le client Traoré Moussa (CLI-1042) présente un Risk Score de 87/100, classé en risque Élevé. Ce score s'explique par 4 facteurs calculés par les règles métier : (1) Fractionnement potentiel — 28/30 pts : 6 transactions cumulant 4 800 000 FCFA ont été détectées sous le seuil de 1 000 000 FCFA sur 48h. (2) Volume inhabituel — 22/25 pts : le montant moyen récent (3,4M FCFA) dépasse de 300% la moyenne historique (850k FCFA). (3) Fréquence anormale — 18/20 pts. (4) Relations inhabituelles — 19/10 pts : un bénéficiaire lié est déjà signalé dans le graphe. Aucune correspondance PPE/sanctions n'a été identifiée pour ce client." },
  { q: "Pourquoi Diarra Fatoumata est-elle signalée ?", a: "Diarra Fatoumata (CLI-1087) a un score de 72/100. Le facteur principal est une Correspondance PPE — 15/15 pts : une similarité de 96% a été détectée avec une entrée de la Liste PPE Mali (Conseiller ministériel). Le fuzzy matching a été calibré sur les variantes orthographiques ouest-africaines (FLT-02). S'y ajoutent un volume inhabituel (20/25 pts) et un fractionnement potentiel (15/30 pts). Une revue humaine est requise avant toute mesure (FLT-04)." },
  { q: "Quelle est la plus grosse source d'alertes ?", a: "Ce mois, 456 alertes ont été générées. La plus grosse source est le Fractionnement potentiel avec 167 alertes (34,9% du total), suivie du Volume inhabituel (23,1%) et des Correspondances PPE/sanctions (18,3%). Une opportunité d'optimisation : calibrer davantage le fuzzy matching PPE pour réduire les faux positifs (taux actuel : 23%)." },
]

const factors = [
  { label: "Fractionnement", points: 28, max: 30 },
  { label: "Volume inhabituel", points: 22, max: 25 },
  { label: "Fréquence", points: 18, max: 20 },
  { label: "PPE/sanctions", points: 0, max: 15 },
  { label: "Relations", points: 19, max: 10 },
]

export function AssistantIAView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour, je suis l'assistant IA de LAKANA. Je peux vous expliquer en langage clair le score et les facteurs de risque d'un client, à partir des éléments déjà calculés par les règles métier. Comment puis-je vous aider ?",
    },
  ])
  const [input, setInput] = useState("")

  const send = (text?: string) => {
    const q = (text ?? input).trim()
    if (!q) return
    const preset = presets.find((p) => p.q.toLowerCase() === q.toLowerCase())
    const answer = preset?.a ?? "Je ne peux répondre qu'à partir des facteurs déjà calculés par les règles métier de LAKANA (IA-02). Pour cette question, je vous recommande de consulter la fiche Client 360° ou le Centre d'alertes. Rappel : la décision finale vous revient (IA-03)."
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: answer }])
    setInput("")
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">Assistant IA</h1>
        <p className="mt-1 text-sm text-slate-500">Aide à l'analyse — explication en langage clair des scores et facteurs (IA-01 à 04).</p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Chat */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white xl:col-span-2" style={{ height: 560 }}>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Assistant LAKANA</p>
                <p className="text-[11px] text-emerald-600">● En ligne</p>
              </div>
            </div>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
              Mode secours disponible (IA-04)
            </Badge>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5 sidebar-scroll">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  m.role === "assistant"
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                    : "bg-slate-200"
                )}>
                  {m.role === "assistant" ? (
                    <Sparkles className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-slate-600" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "assistant"
                    ? "rounded-tl-sm bg-slate-50 text-slate-700"
                    : "rounded-tr-sm bg-indigo-600 text-white"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Posez votre question..."
                className="h-10 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={() => send()}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4 xl:col-span-1">
          {/* Quick questions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Questions suggérées</h3>
            <div className="mt-3 space-y-2">
              {presets.map((p) => (
                <button
                  key={p.q}
                  onClick={() => send(p.q)}
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-700"
                >
                  {p.q}
                </button>
              ))}
            </div>
          </div>

          {/* Context card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Contexte : Traoré M.</h3>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">Score actuel</span>
              <span className="text-lg font-bold text-rose-600">87/100</span>
            </div>
            <div className="mt-3 space-y-2">
              {factors.map((f) => (
                <div key={f.label}>
                  <div className="mb-0.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{f.label}</span>
                    <span className="font-semibold text-slate-700">{f.points}/{f.max}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full", f.points / f.max > 0.7 ? "bg-rose-500" : f.points / f.max > 0.4 ? "bg-amber-500" : "bg-emerald-500")}
                      style={{ width: `${(f.points / f.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-amber-800">Décision humaine finale</p>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                  L'assistant rappelle que la décision finale revient à l'analyste habilité (IA-03). Ses explications sont fondées exclusivement sur les facteurs calculés, sans rien inventer (IA-02).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

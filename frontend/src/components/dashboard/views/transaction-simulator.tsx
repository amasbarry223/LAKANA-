"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowRightLeft,
  Send,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ChevronDown,
  Wallet,
  Clock,
  Shield,
  Zap,
  FileText,
  User,
  Building2,
  Star,
  BarChart2,
  CreditCard,
} from "lucide-react"
import { toast } from "sonner"
import { clientService } from "@/services/clientService"
import { transactionService, type SimulationResult } from "@/services/transactionService"
import type { Client } from "@/models/client"

const TYPES_OPERATION = [
  "Dépôt",
  "Retrait",
  "Virement entrant",
  "Virement sortant",
  "Paiement marchand",
  "Transfert international",
  "Change de devises",
]

const CANAUX = ["Guichet", "Mobile Money", "Virement bancaire", "SWIFT", "Chèque", "TPE", "Internet"]
const DEVISES = ["XOF", "EUR", "USD", "GBP", "CHF"]
const SEUIL_UEMOA = 5_000_000

function Badge({ children, color }: { children: React.ReactNode; color: "green" | "yellow" | "red" | "blue" | "purple" | "gray" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
    gray: "bg-slate-100 text-slate-600 border border-slate-200",
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n)
}

function AmlResultCard({ result }: { result: SimulationResult }) {
  const alerte = result.alerte_declenchee
  const seuilDepasse = result.seuil_uemoa_depasse
  const hasAlert = !!alerte
  return (
    <div className={`rounded-2xl border-2 p-6 transition-all ${hasAlert ? "border-red-300 bg-red-50" : seuilDepasse ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50"}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${hasAlert ? "bg-red-100" : seuilDepasse ? "bg-amber-100" : "bg-emerald-100"}`}>
          {hasAlert ? <AlertTriangle className="w-6 h-6 text-red-600" /> : seuilDepasse ? <Shield className="w-6 h-6 text-amber-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
        </div>
        <div>
          <p className={`text-lg font-bold ${hasAlert ? "text-red-800" : seuilDepasse ? "text-amber-800" : "text-emerald-800"}`}>
            {hasAlert ? "Alerte AML déclenchée" : seuilDepasse ? "Seuil UEMOA dépassé" : "Transaction conforme"}
          </p>
          <p className={`text-sm ${hasAlert ? "text-red-600" : seuilDepasse ? "text-amber-600" : "text-emerald-600"}`}>Réf : {result.transaction.reference}</p>
        </div>
      </div>
      {alerte && (
        <div className="bg-white rounded-xl border border-red-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-800 text-sm">Détail de l alerte</p>
            <Badge color="red">{alerte.niveau}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-slate-500 text-xs">Référence</p><p className="font-mono font-medium text-slate-800">{alerte.reference}</p></div>
            <div><p className="text-slate-500 text-xs">Type</p><p className="font-medium text-slate-800">{alerte.type_alerte}</p></div>
            <div>
              <p className="text-slate-500 text-xs">Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(alerte.score, 100)}%` }} />
                </div>
                <span className="font-bold text-red-600">{alerte.score}</span>
              </div>
            </div>
            <div><p className="text-slate-500 text-xs">Module</p><p className="font-medium text-slate-800">{alerte.module}</p></div>
          </div>
          {alerte.facteurs && alerte.facteurs.length > 0 && (
            <div className="mt-3">
              <p className="text-slate-500 text-xs mb-1.5">Facteurs déclencheurs</p>
              <div className="flex flex-wrap gap-1.5">
                {alerte.facteurs.map((f: string, i: number) => (
                  <span key={i} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {result.nouveau_solde != null && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600"><Wallet className="w-4 h-4" /><span className="text-sm font-medium">Nouveau solde estimé</span></div>
          <span className="font-bold text-slate-800 text-lg">{formatAmount(result.nouveau_solde)}</span>
        </div>
      )}
    </div>
  )
}

interface HistoryItem { id: string; client: string; montant: number; type: string; hasAlert: boolean; seuilDepasse: boolean; ts: Date }

function HistoryRow({ item }: { item: HistoryItem }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.hasAlert ? "bg-red-100" : item.seuilDepasse ? "bg-amber-100" : "bg-emerald-100"}`}>
        {item.hasAlert ? <AlertTriangle className="w-4 h-4 text-red-600" /> : item.seuilDepasse ? <Shield className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.client}</p>
        <p className="text-xs text-slate-500">{item.type}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-800">{formatAmount(item.montant)}</p>
        <p className="text-xs text-slate-400">{item.ts.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </div>
  )
}

export function TransactionSimulatorView() {
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [clientDropdown, setClientDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [montant, setMontant] = useState("")
  const [typeOperation, setTypeOperation] = useState(TYPES_OPERATION[0])
  const [canal, setCanal] = useState(CANAUX[0])
  const [devise, setDevise] = useState("XOF")
  const [beneficiaire, setBeneficiaire] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const loadClients = useCallback(async () => {
    setLoadingClients(true)
    try { setClients(await clientService.getClients()) } catch { setClients([]) } finally { setLoadingClients(false) }
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase()
    return `${c.prenom || ""} ${c.nom} ${c.codeClient} ${c.raisonSociale || ""}`.toLowerCase().includes(q)
  })

  const montantNum = parseFloat(montant.replace(/\s/g, "").replace(",", ".")) || 0
  const seuilPercent = Math.min((montantNum / SEUIL_UEMOA) * 100, 100)
  const procheSeuil = montantNum > SEUIL_UEMOA * 0.8 && montantNum < SEUIL_UEMOA
  const depasse = montantNum >= SEUIL_UEMOA

  const handleSimulate = async () => {
    if (!selectedClient) { toast.error("Sélectionnez un client"); return }
    if (!montantNum || montantNum <= 0) { toast.error("Montant invalide"); return }
    setLoading(true); setResult(null)
    const ref = `SIM-${Date.now()}`
    try {
      const res = await transactionService.simulateTransaction({ reference: ref, clientId: selectedClient.id, montant: montantNum, typeOperation, canal, devise, beneficiaireNom: beneficiaire || undefined, description: description || undefined })
      setResult(res)
      const clientName = selectedClient.typeClient === "Entreprise" ? (selectedClient.raisonSociale || selectedClient.nom) : `${selectedClient.prenom || ""} ${selectedClient.nom}`.trim()
      setHistory((prev) => [{ id: ref, client: clientName, montant: montantNum, type: typeOperation, hasAlert: !!res.alerte_declenchee, seuilDepasse: res.seuil_uemoa_depasse, ts: new Date() }, ...prev.slice(0, 19)])
      if (res.alerte_declenchee) toast.error("Alerte AML déclenchée !", { description: `Type : ${res.alerte_declenchee.type_alerte} — Score : ${res.alerte_declenchee.score}` })
      else if (res.seuil_uemoa_depasse) toast.warning("Seuil UEMOA franchi", { description: "Déclaration CENTIF requise." })
      else toast.success("Transaction conforme", { description: "Aucune anomalie détectée." })
    } catch (e: any) {
      toast.error("Erreur de simulation", { description: e?.message || "Vérifiez le backend." })
    } finally { setLoading(false) }
  }

  const handleReset = () => { setMontant(""); setBeneficiaire(""); setDescription(""); setResult(null); setTypeOperation(TYPES_OPERATION[0]); setCanal(CANAUX[0]); setDevise("XOF") }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-indigo-600" />
            Simulateur de transactions
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Simulez des transactions et visualisez les alertes AML en temps réel</p>
        </div>
        <Badge color="blue"><Zap className="w-3 h-3" />Seuil UEMOA : {formatAmount(SEUIL_UEMOA)}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              Paramètres de la transaction
            </h2>

            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Client <span className="text-red-500">*</span></label>
              <div className="relative">
                <button id="sim-client-select" type="button" onClick={() => setClientDropdown((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-indigo-400 focus:outline-none focus:border-indigo-500 transition-colors">
                  {selectedClient ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        {selectedClient.typeClient === "Entreprise" ? <Building2 className="w-3.5 h-3.5 text-indigo-600" /> : <User className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="font-medium text-slate-800 truncate">
                        {selectedClient.typeClient === "Entreprise" ? (selectedClient.raisonSociale || selectedClient.nom) : `${selectedClient.prenom || ""} ${selectedClient.nom}`.trim()}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{selectedClient.codeClient}</span>
                      {selectedClient.estPpe && <Badge color="purple"><Star className="w-2.5 h-2.5" />PPE</Badge>}
                    </div>
                  ) : <span className="text-slate-400">Rechercher un client…</span>}
                  <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${clientDropdown ? "rotate-180" : ""}`} />
                </button>
                {clientDropdown && (
                  <div className="absolute z-30 w-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl">
                    <div className="p-2 border-b border-slate-100">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input id="sim-client-search" autoFocus value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Nom, code, raison sociale…" className="flex-1 bg-transparent text-sm outline-none text-slate-700" />
                        {loadingClients && <Spinner />}
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {filteredClients.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-4">Aucun client trouvé</p>
                      ) : filteredClients.slice(0, 20).map((c) => {
                        const name = c.typeClient === "Entreprise" ? (c.raisonSociale || c.nom) : `${c.prenom || ""} ${c.nom}`.trim()
                        return (
                          <button key={c.id} type="button"
                            onClick={() => { setSelectedClient(c); setClientDropdown(false); setClientSearch("") }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              {c.typeClient === "Entreprise" ? <Building2 className="w-3.5 h-3.5 text-indigo-600" /> : <User className="w-3.5 h-3.5 text-indigo-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-sm text-slate-800 truncate">{name}</p>
                                {c.estPpe && <Badge color="purple"><Star className="w-2.5 h-2.5" />PPE</Badge>}
                              </div>
                              <p className="text-xs text-slate-400">{c.codeClient} · {c.niveauRisque}</p>
                            </div>
                            <Badge color={c.niveauRisque === "Élevé" ? "red" : c.niveauRisque === "Moyen" ? "yellow" : "green"}>{c.niveauRisque}</Badge>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Montant <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input id="sim-montant" type="text" inputMode="numeric" value={montant} onChange={(e) => setMontant(e.target.value)}
                    placeholder="Ex : 3 500 000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors pr-16" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">{devise}</span>
                </div>
                <select id="sim-devise" value={devise} onChange={(e) => setDevise(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500">
                  {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {montantNum > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Seuil UEMOA (5 M FCFA)</span>
                    <span className={`font-semibold ${depasse ? "text-red-600" : procheSeuil ? "text-amber-600" : "text-slate-500"}`}>{seuilPercent.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${depasse ? "bg-red-500" : procheSeuil ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${seuilPercent}%` }} />
                  </div>
                  {depasse && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Dépasse le seuil UEMOA — déclaration CENTIF obligatoire</p>}
                  {procheSeuil && <p className="text-amber-600 text-xs mt-1 flex items-center gap-1"><Shield className="w-3 h-3" />Proche du seuil ({formatAmount(SEUIL_UEMOA - montantNum)} restants)</p>}
                </div>
              )}
            </div>

            {/* Type & Canal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Type d opération</label>
                <select id="sim-type-operation" value={typeOperation} onChange={(e) => setTypeOperation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500">
                  {TYPES_OPERATION.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Canal</label>
                <select id="sim-canal" value={canal} onChange={(e) => setCanal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500">
                  {CANAUX.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Bénéficiaire & Description */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bénéficiaire (optionnel)</label>
                <input id="sim-beneficiaire" type="text" value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)}
                  placeholder="Nom du bénéficiaire" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optionnel)</label>
                <input id="sim-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Motif de la transaction" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 outline-none focus:border-indigo-500" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button id="sim-submit" type="button" onClick={handleSimulate} disabled={loading || !selectedClient || !montantNum}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-sm">
                {loading ? <Spinner /> : <Send className="w-4 h-4" />}
                {loading ? "Analyse en cours…" : "Simuler la transaction"}
              </button>
              <button id="sim-reset" type="button" onClick={handleReset} className="px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {result && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
              <AmlResultCard result={result} />
            </div>
          )}
        </div>

        {/* Panneau droit */}
        <div className="space-y-4">
          {selectedClient && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" />Client sélectionné</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {selectedClient.typeClient === "Entreprise" ? (selectedClient.raisonSociale || selectedClient.nom || "E").charAt(0).toUpperCase() : `${(selectedClient.prenom || "?").charAt(0)}${selectedClient.nom.charAt(0)}`.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">
                    {selectedClient.typeClient === "Entreprise" ? (selectedClient.raisonSociale || selectedClient.nom) : `${selectedClient.prenom || ""} ${selectedClient.nom}`.trim()}
                  </p>
                  <p className="text-xs text-slate-400">{selectedClient.codeClient}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Type</span><Badge color={selectedClient.typeClient === "Entreprise" ? "blue" : "gray"}>{selectedClient.typeClient}</Badge></div>
                <div className="flex justify-between"><span className="text-slate-500">Risque</span><Badge color={selectedClient.niveauRisque === "Élevé" ? "red" : selectedClient.niveauRisque === "Moyen" ? "yellow" : "green"}>{selectedClient.niveauRisque}</Badge></div>
                {selectedClient.estPpe && <div className="flex justify-between"><span className="text-slate-500">PPE</span><Badge color="purple"><Star className="w-3 h-3" />{selectedClient.fonctionPpe || "Oui"}</Badge></div>}
                <div className="flex justify-between"><span className="text-slate-500">Score</span><span className="font-semibold text-slate-800">{selectedClient.riskScore ?? "—"}</span></div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-500" />Règles AML actives</h3>
            <div className="space-y-2">
              {[
                { label: "Seuil UEMOA", desc: ">= 5 000 000 XOF → déclaration CENTIF", dot: "bg-red-500" },
                { label: "PPE", desc: "Score risque x2 si client PPE", dot: "bg-purple-500" },
                { label: "Risque élevé", desc: "Alerte si score > 70", dot: "bg-amber-500" },
                { label: "Transfert intl", desc: "Vérification SWIFT + sanctions", dot: "bg-blue-500" },
              ].map((rule) => (
                <div key={rule.label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${rule.dot}`} />
                  <div><p className="text-xs font-semibold text-slate-700">{rule.label}</p><p className="text-xs text-slate-400">{rule.desc}</p></div>
                </div>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-indigo-500" />Session en cours</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-slate-50 rounded-lg"><p className="text-xl font-bold text-slate-800">{history.length}</p><p className="text-xs text-slate-400">Total</p></div>
                <div className="text-center p-2 bg-red-50 rounded-lg"><p className="text-xl font-bold text-red-600">{history.filter((h) => h.hasAlert).length}</p><p className="text-xs text-slate-400">Alertes</p></div>
                <div className="text-center p-2 bg-emerald-50 rounded-lg"><p className="text-xl font-bold text-emerald-600">{history.filter((h) => !h.hasAlert && !h.seuilDepasse).length}</p><p className="text-xs text-slate-400">Conformes</p></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500" />Historique de session ({history.length})</h3>
          {history.map((item) => <HistoryRow key={item.id} item={item} />)}
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
        <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />Comment utiliser le simulateur ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-indigo-700">
          {["Sélectionnez un client enrôlé dans le système (particulier, entreprise ou PPE).", "Saisissez le montant, le type d opération et le canal utilisé.", "Cliquez sur Simuler pour voir instantanément si une alerte AML est déclenchée."].map((text, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

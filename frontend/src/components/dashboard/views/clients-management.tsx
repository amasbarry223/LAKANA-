"use client"

import { useState, useEffect, useMemo } from "react"
import {
  UserPlus,
  Users,
  Building2,
  ShieldAlert,
  Search,
  RefreshCw,
  Trash2,
  ChevronRight,
  UserCheck,
  AlertTriangle,
  FileText,
  Phone,
  MapPin,
  ExternalLink,
  Plus,
  X,
  BadgeCheck,
  Pencil,
  Save,
  CreditCard,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { clientService } from "@/services/clientService"
import { navigateTo } from "@/lib/navigate"
import type { Client } from "@/models/client"
import { cn } from "@/lib/utils"

type FilterType = "Tous" | "Particuliers" | "Entreprises" | "PPE" | "Risque Élevé"

interface ClientsManagementProps {
  onSelectClient?: (client: Client) => void
}

export function ClientsManagementView({ onSelectClient }: ClientsManagementProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("Tous")
  const [modalOpen, setModalOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editClientType, setEditClientType] = useState<"Particulier" | "Entreprise">("Particulier")
  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    profession: "",
    ville: "Bamako",
    pays: "Mali",
    telephone: "",
    raisonSociale: "",
    formeJuridique: "SARL",
    rccm: "",
    nif: "",
    secteurActivite: "",
    beneficiaireEffectif: "",
    pieceIdentite: "",
    estPpe: false,
    fonctionPpe: "",
    typePpe: "PPE Nationale",
    paysMandat: "Mali",
    niveauRisque: "Faible" as string,
  })

  // Account creation modal state
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [clientForAccount, setClientForAccount] = useState<Client | null>(null)
  const [accountSubmitting, setAccountSubmitting] = useState(false)
  const [accountForm, setAccountForm] = useState({
    numeroCompte: "",
    typeCompte: "Courant",
    solde: 100000,
    devise: "XOF",
    motifOuverture: "",
  })

  // Multi-account AML alert modal
  const [alertFeedbackModal, setAlertFeedbackModal] = useState<{
    open: boolean
    alerte: {
      reference: string
      type_alerte: string
      niveau: string
      score: number
      facteurs: string[]
    }
    rang: number
    clientName: string
    numeroCompte: string
  } | null>(null)

  // Form State
  const [clientType, setClientType] = useState<"Particulier" | "Entreprise">("Particulier")
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    profession: "",
    ville: "Bamako",
    pays: "Mali",
    telephone: "",
    // Entreprise
    raisonSociale: "",
    formeJuridique: "SARL",
    rccm: "",
    nif: "",
    secteurActivite: "Commerce général",
    beneficiaireEffectif: "",
    // Particulier & PPE
    pieceIdentite: "",
    estPpe: false,
    fonctionPpe: "",
    typePpe: "PPE Nationale",
    paysMandat: "Mali",
  })

  // Fetch clients from API
  const fetchClients = async () => {
    setLoading(true)
    try {
      const data = await clientService.getClients()
      setClients(data)
    } catch (err) {
      toast.error("Impossible de charger les clients")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Filtering
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // Type Filter
      if (filter === "Particuliers" && c.typeClient === "Entreprise") return false
      if (filter === "Entreprises" && c.typeClient !== "Entreprise") return false
      if (filter === "PPE" && !c.estPpe) return false
      if (filter === "Risque Élevé" && c.niveauRisque !== "Élevé") return false

      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchNom = c.nom.toLowerCase().includes(q)
        const matchPrenom = c.prenom?.toLowerCase().includes(q)
        const matchCode = c.codeClient.toLowerCase().includes(q)
        const matchRaison = c.raisonSociale?.toLowerCase().includes(q)
        const matchRccm = c.rccm?.toLowerCase().includes(q)
        const matchNif = c.nif?.toLowerCase().includes(q)
        const matchVille = c.ville?.toLowerCase().includes(q)
        return matchNom || matchPrenom || matchCode || matchRaison || matchRccm || matchNif || matchVille
      }
      return true
    })
  }, [clients, filter, search])

  // KPIs
  const totalCount = clients.length
  const particuliersCount = clients.filter((c) => c.typeClient !== "Entreprise").length
  const entreprisesCount = clients.filter((c) => c.typeClient === "Entreprise").length
  const ppeCount = clients.filter((c) => c.estPpe).length
  const highRiskCount = clients.filter((c) => c.niveauRisque === "Élevé").length

  // Create Client Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (clientType === "Particulier" && !form.nom.trim()) {
      toast.error("Veuillez saisir le nom du particulier")
      return
    }
    if (clientType === "Entreprise" && !form.raisonSociale.trim()) {
      toast.error("Veuillez saisir la raison sociale de l'entreprise")
      return
    }

    setSubmitting(true)
    try {
      const payload: Partial<Client> = {
        codeClient: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
        typeClient: clientType,
        nom: clientType === "Entreprise" ? form.raisonSociale : form.nom,
        prenom: clientType === "Entreprise" ? "" : form.prenom,
        dateNaissance: form.dateNaissance,
        profession: clientType === "Entreprise" ? form.secteurActivite : form.profession,
        ville: form.ville,
        pays: form.pays,
        telephone: form.telephone,
        raisonSociale: form.raisonSociale,
        formeJuridique: form.formeJuridique,
        rccm: form.rccm,
        nif: form.nif,
        secteurActivite: form.secteurActivite,
        beneficiaireEffectif: form.beneficiaireEffectif,
        pieceIdentite: form.pieceIdentite,
        estPpe: clientType === "Particulier" ? form.estPpe : false,
        fonctionPpe: form.fonctionPpe,
        typePpe: form.typePpe,
        paysMandat: form.paysMandat,
        niveauRisque: clientType === "Particulier" && form.estPpe ? "Élevé" : "Faible",
        riskScore: clientType === "Particulier" && form.estPpe ? 75 : 15,
      }

      const created = await clientService.createClient(payload)
      setClients((prev) => [created, ...prev])
      toast.success(
        clientType === "Entreprise" ? "Entreprise enrôlée avec succès" : "Particulier enrôlé avec succès",
        {
          description: `Dossier créé sous le code ${created.codeClient}`,
        }
      )
      setModalOpen(false)
      // Reset form
      setForm({
        nom: "",
        prenom: "",
        dateNaissance: "",
        profession: "",
        ville: "Bamako",
        pays: "Mali",
        telephone: "",
        raisonSociale: "",
        formeJuridique: "SARL",
        rccm: "",
        nif: "",
        secteurActivite: "Commerce général",
        beneficiaireEffectif: "",
        pieceIdentite: "",
        estPpe: false,
        fonctionPpe: "",
        typePpe: "PPE Nationale",
        paysMandat: "Mali",
      })
    } catch (err: any) {
      toast.error("Erreur lors de l'enrôlement du client", {
        description: err.message || "Vérifiez les informations fournies",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Open edit modal with prefill
  const openEditModal = (client: Client) => {
    setClientToEdit(client)
    setEditClientType(client.typeClient as "Particulier" | "Entreprise")
    setEditForm({
      nom: client.typeClient === "Entreprise" ? client.nom : client.nom,
      prenom: client.prenom || "",
      dateNaissance: client.dateNaissance || "",
      profession: client.profession || "",
      ville: client.ville || "Bamako",
      pays: client.pays || "Mali",
      telephone: client.telephone || "",
      raisonSociale: client.raisonSociale || "",
      formeJuridique: client.formeJuridique || "SARL",
      rccm: client.rccm || "",
      nif: client.nif || "",
      secteurActivite: client.secteurActivite || "",
      beneficiaireEffectif: client.beneficiaireEffectif || "",
      pieceIdentite: client.pieceIdentite || "",
      estPpe: Boolean(client.estPpe),
      fonctionPpe: client.fonctionPpe || "",
      typePpe: client.typePpe || "PPE Nationale",
      paysMandat: client.paysMandat || "Mali",
      niveauRisque: client.niveauRisque || "Faible",
    })
    setEditModalOpen(true)
  }

  // Update client submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientToEdit) return

    if (editClientType === "Particulier" && !editForm.nom.trim()) {
      toast.error("Veuillez saisir le nom du client")
      return
    }
    if (editClientType === "Entreprise" && !editForm.raisonSociale.trim()) {
      toast.error("Veuillez saisir la raison sociale")
      return
    }

    setEditSubmitting(true)
    try {
      const payload: Partial<Client> = {
        typeClient: editClientType,
        nom: editClientType === "Entreprise" ? editForm.raisonSociale : editForm.nom,
        prenom: editClientType === "Entreprise" ? "" : editForm.prenom,
        dateNaissance: editForm.dateNaissance,
        profession: editClientType === "Entreprise" ? editForm.secteurActivite : editForm.profession,
        ville: editForm.ville,
        pays: editForm.pays,
        telephone: editForm.telephone,
        raisonSociale: editForm.raisonSociale,
        formeJuridique: editForm.formeJuridique,
        rccm: editForm.rccm,
        nif: editForm.nif,
        secteurActivite: editForm.secteurActivite,
        beneficiaireEffectif: editForm.beneficiaireEffectif,
        pieceIdentite: editForm.pieceIdentite,
        estPpe: editClientType === "Particulier" ? editForm.estPpe : false,
        fonctionPpe: editForm.fonctionPpe,
        typePpe: editForm.typePpe,
        paysMandat: editForm.paysMandat,
        niveauRisque: editForm.niveauRisque,
      }

      const updated = await clientService.updateClient(clientToEdit.id, payload)
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      toast.success("Client mis à jour", {
        description: `Le dossier ${updated.codeClient} a été modifié avec succès.`,
      })
      setEditModalOpen(false)
      setClientToEdit(null)
    } catch (err: any) {
      toast.error("Erreur lors de la mise à jour", {
        description: err.message || "Vérifiez les informations saisies",
      })
    } finally {
      setEditSubmitting(false)
    }
  }

  // Delete Client
  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return
    try {
      await clientService.deleteClient(clientToDelete.id)
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id))
      toast.success("Client supprimé", {
        description: `Le dossier ${clientToDelete.codeClient} a été supprimé de la base de données.`,
      })
    } catch (err: any) {
      toast.error("Erreur lors de la suppression du client")
    } finally {
      setClientToDelete(null)
    }
  }

  // Open Add Account Modal
  const openAddAccountModal = (client: Client) => {
    setClientForAccount(client)
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000)
    setAccountForm({
      numeroCompte: `ML021${randomSuffix}`,
      typeCompte: "Courant",
      solde: 100000,
      devise: "XOF",
      motifOuverture: "",
    })
    setAccountModalOpen(true)
  }

  // Create Account Submit
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientForAccount) return

    if (!accountForm.numeroCompte.trim()) {
      toast.error("Veuillez renseigner un numéro de compte valide")
      return
    }

    setAccountSubmitting(true)
    try {
      const res = await clientService.addAccount(clientForAccount.id, {
        numero_compte: accountForm.numeroCompte.trim(),
        type_compte: accountForm.typeCompte,
        solde: Number(accountForm.solde) || 0,
        devise: accountForm.devise || "XOF",
      })

      toast.success(res.message || "Compte créé avec succès")
      setAccountModalOpen(false)

      // Si une alerte multi-comptes a été générée (2ème compte ou plus)
      if (res.alerte_declenchee) {
        setAlertFeedbackModal({
          open: true,
          alerte: res.alerte_declenchee,
          rang: res.rang_compte,
          clientName:
            clientForAccount.typeClient === "Entreprise"
              ? clientForAccount.raisonSociale || clientForAccount.nom
              : `${clientForAccount.nom} ${clientForAccount.prenom || ""}`.trim(),
          numeroCompte: accountForm.numeroCompte.trim(),
        })
      }

      await fetchClients()
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || "Erreur lors de la création du compte"
      toast.error(detail)
    } finally {
      setAccountSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Gestion & Enrôlement des Clients
            </h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              Conformité KYC / AML
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enrôlement en base locale avec distinction Particulier (détection PPE) et Entreprise (UEMOA / CENTIF).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchClients}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={cn("h-4 w-4 text-slate-500", loading && "animate-spin")} />
            Actualiser
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Enrôler un client
          </button>
        </div>
      </div>

      {/* Cartes Métriques (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-slate-500">Total Clients</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalCount}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <UserCheck className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-slate-500">Particuliers</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{particuliersCount}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-slate-500">Entreprises</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{entreprisesCount}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-slate-500">Statut PPE</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{ppeCount}</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium text-slate-500">Risque Élevé</span>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{highRiskCount}</p>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, code, raison sociale, NIF, RCCM, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(["Tous", "Particuliers", "Entreprises", "PPE", "Risque Élevé"] as FilterType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0",
                filter === tab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table des Clients */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Code Client</th>
                <th className="px-5 py-3.5 font-semibold">Client / Raison Sociale</th>
                <th className="px-5 py-3.5 font-semibold">Type & Secteur</th>
                <th className="px-5 py-3.5 font-semibold">Comptes bancaires</th>
                <th className="px-5 py-3.5 font-semibold">Statut PPE / Registre</th>
                <th className="px-5 py-3.5 font-semibold">Localisation</th>
                <th className="px-5 py-3.5 font-semibold">Score de Risque</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    Chargement des clients depuis PostgreSQL...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Aucun client trouvé pour cette sélection.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isEntreprise = client.typeClient === "Entreprise"
                  const displayName = isEntreprise
                    ? client.raisonSociale || client.nom
                    : `${client.nom} ${client.prenom || ""}`.trim()

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Code */}
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {client.codeClient}
                      </td>

                      {/* Nom / Raison Sociale */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold",
                              isEntreprise
                                ? "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            )}
                          >
                            {isEntreprise ? <Building2 className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {displayName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {isEntreprise
                                ? `Forme : ${client.formeJuridique || "SARL"}`
                                : client.profession || "Particulier"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type & Secteur */}
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px]",
                            isEntreprise
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          )}
                        >
                          {isEntreprise ? "Personne Morale" : "Personne Physique"}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          {isEntreprise ? client.secteurActivite || "Négoce" : client.pieceIdentite || "CNI vérifiée"}
                        </p>
                      </td>

                      {/* Comptes bancaires */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {(client.comptes?.length || 0)} cpt{(client.comptes?.length || 0) > 1 ? "s" : "e"}
                            </span>
                            {(client.comptes?.length || 0) >= 2 && (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 text-[10px] px-1.5 py-0">
                                Multi-comptes
                              </Badge>
                            )}
                          </div>
                          {client.comptes && client.comptes.length > 0 ? (
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5 max-w-[150px]">
                              {client.comptes.slice(0, 2).map((a: any, idx: number) => (
                                <div key={idx} className="truncate" title={a.numeroCompte || a.numero_compte}>
                                  • {a.numeroCompte || a.numero_compte}
                                </div>
                              ))}
                              {client.comptes.length > 2 && (
                                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                                  +{client.comptes.length - 2} autre(s)
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Aucun compte</span>
                          )}
                        </div>
                      </td>

                      {/* PPE / Identifiants légaux */}
                      <td className="px-5 py-4">
                        {isEntreprise ? (
                          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                            <p>
                              <span className="font-medium text-slate-400">RCCM:</span> {client.rccm || "-"}
                            </p>
                            <p>
                              <span className="font-medium text-slate-400">NIF:</span> {client.nif || "-"}
                            </p>
                          </div>
                        ) : client.estPpe ? (
                          <div>
                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-300 gap-1 text-[11px]">
                              <ShieldAlert className="h-3 w-3" />
                              PPE Détecté
                            </Badge>
                            <p className="text-[11px] font-medium text-rose-600 mt-0.5">
                              {client.fonctionPpe || client.typePpe || "Fonction officielle"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Non-PPE (Standard)
                          </span>
                        )}
                      </td>

                      {/* Localisation */}
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>
                            {client.ville || "Bamako"}, {client.pays || "Mali"}
                          </span>
                        </div>
                        {client.telephone && (
                          <div className="flex items-center gap-1 mt-0.5 text-slate-400 text-[11px]">
                            <Phone className="h-2.5 w-2.5" />
                            <span>{client.telephone}</span>
                          </div>
                        )}
                      </td>

                      {/* Score de Risque */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-xs font-bold",
                              client.niveauRisque === "Élevé"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                                : client.niveauRisque === "Moyen"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            )}
                          >
                            {client.riskScore}/100
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {client.niveauRisque}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onSelectClient && (
                            <button
                              onClick={() => onSelectClient(client)}
                              title="Voir Client 360°"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openAddAccountModal(client)}
                            title="Ouvrir / Ajouter un compte bancaire (Alerte AML si multi-comptes)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(client)}
                            title="Modifier les informations client"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setClientToDelete(client)}
                            title="Supprimer le dossier client"
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'enrôlement client */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Enrôlement d'un Nouveau Client
                  </h2>
                  <p className="text-xs text-slate-500">
                    Saisie conforme à la réglementation UEMOA et aux exigences du CENTIF.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-5">
              {/* Sélecteur de type de client */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                  Type d'entité à enrôler *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setClientType("Particulier")}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition",
                      clientType === "Particulier"
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <UserCheck className="h-5 w-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Particulier</p>
                      <p className="text-xs text-slate-500">Personne physique (Salarié, Commerçant, PPE)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClientType("Entreprise")}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition",
                      clientType === "Entreprise"
                        ? "border-violet-600 bg-violet-50/50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 ring-2 ring-violet-500/20"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <Building2 className="h-5 w-5 text-violet-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Entreprise</p>
                      <p className="text-xs text-slate-500">Personne morale (SARL, SA, GIE, SFD)</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Champs Spécifiques : ENTREPRISE */}
              {clientType === "Entreprise" && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Raison Sociale *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Sahel Transit SARL"
                        value={form.raisonSociale}
                        onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Forme Juridique
                      </label>
                      <select
                        value={form.formeJuridique}
                        onChange={(e) => setForm({ ...form, formeJuridique: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                        <option value="SA">SA (Société Anonyme)</option>
                        <option value="SUARL">SUARL (SARL Unipersonnelle)</option>
                        <option value="GIE">GIE (Groupement d'Intérêt Économique)</option>
                        <option value="Entreprise Individuelle">Entreprise Individuelle</option>
                        <option value="Association">Association / ONG</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Numéro RCCM (Registre du commerce)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: MA.BKO.2024.B.1298"
                        value={form.rccm}
                        onChange={(e) => setForm({ ...form, rccm: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Numéro d'Identification Fiscale (NIF)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 084512984X"
                        value={form.nif}
                        onChange={(e) => setForm({ ...form, nif: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Secteur d'Activité
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Import-Export céréales, BTP, Transit..."
                        value={form.secteurActivite}
                        onChange={(e) => setForm({ ...form, secteurActivite: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bénéficiaires Effectifs (UBO &gt; 25%)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ousmane Diallo (60%), Awa Keita (40%)"
                        value={form.beneficiaireEffectif}
                        onChange={(e) => setForm({ ...form, beneficiaireEffectif: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Champs Spécifiques : PARTICULIER */}
              {clientType === "Particulier" && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nom de famille *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Traoré"
                        value={form.nom}
                        onChange={(e) => setForm({ ...form, nom: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Prénom(s)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Moussa"
                        value={form.prenom}
                        onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Date de naissance
                      </label>
                      <input
                        type="date"
                        value={form.dateNaissance}
                        onChange={(e) => setForm({ ...form, dateNaissance: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Profession
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Commerçant, Médecin..."
                        value={form.profession}
                        onChange={(e) => setForm({ ...form, profession: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Pièce d'Identité (CNI / NINA)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: CNI 102948291M"
                        value={form.pieceIdentite}
                        onChange={(e) => setForm({ ...form, pieceIdentite: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* SECTION SPÉCIFIQUE PPE (Personne Politiquement Exposée) */}
                  <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="h-5 w-5 text-amber-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            Personne Politiquement Exposée (PPE)
                          </p>
                          <p className="text-xs text-slate-500">
                            Exposition à un mandat public, fonction politique ou proche associé.
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.estPpe}
                          onChange={(e) => setForm({ ...form, estPpe: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {/* Détails PPE si activé */}
                    {form.estPpe && (
                      <div className="mt-4 pt-4 border-t border-amber-200/60 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
                              Fonction / Mandat public *
                            </label>
                            <input
                              type="text"
                              required={form.estPpe}
                              placeholder="Ex: Député, Ministre, DG..."
                              value={form.fonctionPpe}
                              onChange={(e) => setForm({ ...form, fonctionPpe: e.target.value })}
                              className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
                              Typologie PPE
                            </label>
                            <select
                              value={form.typePpe}
                              onChange={(e) => setForm({ ...form, typePpe: e.target.value })}
                              className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="PPE Nationale">PPE Nationale</option>
                              <option value="PPE Étrangère">PPE Étrangère</option>
                              <option value="Organisation Internationale">Organisation Internationale</option>
                              <option value="Famille proche de PPE">Famille proche de PPE</option>
                              <option value="Étroit associé de PPE">Étroit associé de PPE</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
                              Pays du mandat
                            </label>
                            <input
                              type="text"
                              value={form.paysMandat}
                              onChange={(e) => setForm({ ...form, paysMandat: e.target.value })}
                              className="w-full px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          <strong>Mesure réglementaire :</strong> L&apos;enrôlement en tant que PPE déclenche automatiquement une vigilance renforcée (EDD) et un niveau de risque élevé sous surveillance CENTIF.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Coordonnées communes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="+223 70 00 00 00"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ville de résidence / Siège
                  </label>
                  <input
                    type="text"
                    value={form.ville}
                    onChange={(e) => setForm({ ...form, ville: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pays
                  </label>
                  <input
                    type="text"
                    value={form.pays}
                    onChange={(e) => setForm({ ...form, pays: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Enrôler et Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Boîte de Dialogue ConfirmDialog OBLIGATOIRE pour la Suppression */}
      <ConfirmDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
        title="Supprimer le dossier client ?"
        description={
          clientToDelete ? (
            <span>
              Êtes-vous sûr de vouloir supprimer définitivement le client{" "}
              <strong>
                {clientToDelete.typeClient === "Entreprise"
                  ? clientToDelete.raisonSociale || clientToDelete.nom
                  : `${clientToDelete.nom} ${clientToDelete.prenom || ""}`.trim()}
              </strong>{" "}
              (Code: <code>{clientToDelete.codeClient}</code>) ? Cette action supprimera également
              tous ses comptes rattachés et sera tracée dans le journal d'audit réglementaire.
            </span>
          ) : null
        }
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* ═══════════════ MODALE MODIFICATION CLIENT ═══════════════ */}
      {editModalOpen && clientToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Modifier le dossier client
                  </h2>
                  <p className="text-xs text-slate-500">
                    Code : <span className="font-mono font-semibold text-indigo-600">{clientToEdit.codeClient}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setEditModalOpen(false); setClientToEdit(null) }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {/* Type de client (lecture seule, on affiche mais on ne change pas le type) */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                {editClientType === "Entreprise" ? (
                  <Building2 className="h-5 w-5 text-violet-600" />
                ) : (
                  <UserCheck className="h-5 w-5 text-blue-600" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {editClientType === "Entreprise" ? "Personne Morale (Entreprise)" : "Personne Physique (Particulier)"}
                  </p>
                  <p className="text-xs text-slate-500">Le type d'entité ne peut pas être modifié après enrôlement.</p>
                </div>
              </div>

              {/* ── Champs PARTICULIER ── */}
              {editClientType === "Particulier" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Nom *</label>
                      <input
                        value={editForm.nom}
                        onChange={(e) => setEditForm((f) => ({ ...f, nom: e.target.value }))}
                        required
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        placeholder="Nom de famille"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Prénom</label>
                      <input
                        value={editForm.prenom}
                        onChange={(e) => setEditForm((f) => ({ ...f, prenom: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        placeholder="Prénom"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Date de naissance</label>
                      <input
                        type="date"
                        value={editForm.dateNaissance}
                        onChange={(e) => setEditForm((f) => ({ ...f, dateNaissance: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Profession</label>
                      <input
                        value={editForm.profession}
                        onChange={(e) => setEditForm((f) => ({ ...f, profession: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        placeholder="Ex: Enseignant, Commerçant..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Pièce d'identité</label>
                    <select
                      value={editForm.pieceIdentite}
                      onChange={(e) => setEditForm((f) => ({ ...f, pieceIdentite: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                      <option value="">Sélectionner...</option>
                      {["CNI", "Passeport", "Permis de conduire", "Carte de résident", "Titre de séjour"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Section PPE */}
                  <div className={cn("rounded-xl border p-4 space-y-3", editForm.estPpe ? "border-rose-300 bg-rose-50 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className={cn("h-4 w-4", editForm.estPpe ? "text-rose-600" : "text-slate-400")} />
                        <span className={cn("text-sm font-semibold", editForm.estPpe ? "text-rose-700 dark:text-rose-400" : "text-slate-600 dark:text-slate-300")}>
                          Personne Politiquement Exposée (PPE)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditForm((f) => ({ ...f, estPpe: !f.estPpe }))}
                        className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", editForm.estPpe ? "bg-rose-500" : "bg-slate-300")}
                      >
                        <span className={cn("pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform", editForm.estPpe ? "translate-x-6" : "translate-x-1")} />
                      </button>
                    </div>
                    {editForm.estPpe && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-xs font-semibold text-rose-600 mb-1 block">Fonction officielle *</label>
                          <input
                            value={editForm.fonctionPpe}
                            onChange={(e) => setEditForm((f) => ({ ...f, fonctionPpe: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                            placeholder="Ex: Ministre, Député..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-rose-600 mb-1 block">Type PPE</label>
                          <select
                            value={editForm.typePpe}
                            onChange={(e) => setEditForm((f) => ({ ...f, typePpe: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                          >
                            {["PPE Nationale", "PPE Étrangère", "PPE Internationale", "Entourage PPE"].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-rose-600 mb-1 block">Pays du mandat</label>
                          <input
                            value={editForm.paysMandat}
                            onChange={(e) => setEditForm((f) => ({ ...f, paysMandat: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                            placeholder="Pays d'exercice du mandat"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── Champs ENTREPRISE ── */}
              {editClientType === "Entreprise" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Raison Sociale *</label>
                      <input
                        value={editForm.raisonSociale}
                        onChange={(e) => setEditForm((f) => ({ ...f, raisonSociale: e.target.value }))}
                        required
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        placeholder="Dénomination officielle"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Forme Juridique</label>
                      <select
                        value={editForm.formeJuridique}
                        onChange={(e) => setEditForm((f) => ({ ...f, formeJuridique: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      >
                        {["SARL", "SA", "SAS", "GIE", "ONG", "Association", "EI", "Coopérative"].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Secteur d'Activité</label>
                      <select
                        value={editForm.secteurActivite}
                        onChange={(e) => setEditForm((f) => ({ ...f, secteurActivite: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      >
                        {["Commerce général", "BTP & Immobilier", "Import/Export", "Services financiers", "Agriculture", "Mines & Ressources", "Transport & Logistique", "Industrie manufacturière", "Technologie", "Santé", "Éducation"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">RCCM</label>
                      <input
                        value={editForm.rccm}
                        onChange={(e) => setEditForm((f) => ({ ...f, rccm: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        placeholder="BKO-2023-XXXX"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">NIF</label>
                      <input
                        value={editForm.nif}
                        onChange={(e) => setEditForm((f) => ({ ...f, nif: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        placeholder="NIF-XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Bénéficiaire Effectif (UBO)</label>
                    <input
                      value={editForm.beneficiaireEffectif}
                      onChange={(e) => setEditForm((f) => ({ ...f, beneficiaireEffectif: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      placeholder="Nom du ou des bénéficiaires effectifs (>25%)"
                    />
                  </div>
                </>
              )}

              {/* ── Champs communs ── */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Informations de contact</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Ville</label>
                    <input
                      value={editForm.ville}
                      onChange={(e) => setEditForm((f) => ({ ...f, ville: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      placeholder="Ville"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Pays</label>
                    <select
                      value={editForm.pays}
                      onChange={(e) => setEditForm((f) => ({ ...f, pays: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                      {["Mali", "Sénégal", "Côte d'Ivoire", "Burkina Faso", "Niger", "Guinée", "Togo", "Bénin", "France", "Autre"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Téléphone</label>
                    <input
                      value={editForm.telephone}
                      onChange={(e) => setEditForm((f) => ({ ...f, telephone: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      placeholder="+223 XXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Niveau de risque manuel */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">Niveau de risque</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["Faible", "Moyen", "Élevé"] as const).map((niveau) => (
                    <button
                      key={niveau}
                      type="button"
                      onClick={() => setEditForm((f) => ({ ...f, niveauRisque: niveau }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition",
                        editForm.niveauRisque === niveau
                          ? niveau === "Élevé"
                            ? "bg-rose-600 border-rose-600 text-white"
                            : niveau === "Moyen"
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {niveau}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setClientToEdit(null) }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'ouverture de compte bancaire */}
      {accountModalOpen && clientForAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Ouvrir un compte bancaire</h2>
                  <p className="text-xs text-slate-500 truncate max-w-[220px]">
                    {clientForAccount.typeClient === "Entreprise"
                      ? clientForAccount.raisonSociale || clientForAccount.nom
                      : `${clientForAccount.nom} ${clientForAccount.prenom || ""}`.trim()}
                    {" "}<span className="text-indigo-600 font-mono font-semibold">({clientForAccount.codeClient})</span>
                  </p>
                </div>
              </div>
              <button onClick={() => { setAccountModalOpen(false); setClientForAccount(null) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            {(clientForAccount.comptes?.length || 0) >= 1 && (
              <div className="mx-6 mt-4 flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <span className="font-bold">Alerte AML automatique :</span> Ce client possede deja{" "}
                  <span className="font-bold">{clientForAccount.comptes?.length} compte(s)</span>. L'ouverture du{" "}
                  <span className="font-bold">{(clientForAccount.comptes?.length || 0) + 1}e compte</span> declenchera une alerte de vigilance renforcee.
                </div>
              </div>
            )}
            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Numero de compte <span className="text-rose-500">*</span></label>
                <input value={accountForm.numeroCompte} onChange={(e) => setAccountForm((f) => ({ ...f, numeroCompte: e.target.value }))} required
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" placeholder="ML021XXXXXXXX" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Type de compte</label>
                <select value={accountForm.typeCompte} onChange={(e) => setAccountForm((f) => ({ ...f, typeCompte: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white">
                  {["Courant", "Epargne", "Tontine", "Micro-credit"].map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Solde initial</label>
                  <input type="number" min={0} value={accountForm.solde} onChange={(e) => setAccountForm((f) => ({ ...f, solde: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Devise</label>
                  <select value={accountForm.devise} onChange={(e) => setAccountForm((f) => ({ ...f, devise: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white">
                    <option value="XOF">XOF (FCFA)</option><option value="EUR">EUR</option><option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Motif d'ouverture / Justification</label>
                <textarea value={accountForm.motifOuverture} onChange={(e) => setAccountForm((f) => ({ ...f, motifOuverture: e.target.value }))} rows={2}
                  placeholder="Ex : Separation des activites professionnelles et personnelles..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none" />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => { setAccountModalOpen(false); setClientForAccount(null) }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Annuler</button>
                <button type="submit" disabled={accountSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm disabled:opacity-50">
                  {accountSubmitting ? (<><RefreshCw className="h-4 w-4 animate-spin" />Creation...</>) : (<><CreditCard className="h-4 w-4" />Creer le compte</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alerte AML multi-comptes */}
      {alertFeedbackModal?.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-600 to-rose-700 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Alerte AML declenchee</h2>
                  <p className="text-xs text-rose-200">Ref. {alertFeedbackModal.alerte.reference} - Niveau : <span className="font-bold uppercase">{alertFeedbackModal.alerte.niveau}</span></p>
                </div>
                <span className="ml-auto bg-white/20 text-white font-bold text-lg px-3 py-1 rounded-lg">{alertFeedbackModal.alerte.score}/100</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-sm font-semibold text-rose-800">{alertFeedbackModal.alerte.type_alerte}</p>
                <p className="text-xs text-rose-600 mt-0.5">Client : <span className="font-bold">{alertFeedbackModal.clientName}</span> - Compte : <span className="font-mono font-bold">{alertFeedbackModal.numeroCompte}</span></p>
                <p className="text-xs text-rose-600 mt-0.5">C'est le <span className="font-bold">{alertFeedbackModal.rang}eme compte</span> de ce client.</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Elements a verifier :</p>
                <ul className="space-y-1.5">
                  {alertFeedbackModal.alerte.facteurs.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="mt-0.5 h-4 w-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] shrink-0">!</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <span className="font-bold">Action requise : </span>
                L'agent doit interroger le client sur la justification economique de cette ouverture de compte et documenter la reponse.
              </div>
              <div className="flex items-center gap-2.5 pt-2">
                <button onClick={() => setAlertFeedbackModal(null)}
                  className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition">Fermer</button>
                <button onClick={() => { setAlertFeedbackModal(null); navigateTo("alerts-center") }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition">
                  <ShieldAlert className="h-4 w-4" />Voir dans les Alertes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

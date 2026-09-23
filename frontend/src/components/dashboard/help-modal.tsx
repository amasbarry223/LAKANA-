"use client"

import { useState, useEffect } from "react"
import {
  X,
  HelpCircle,
  Keyboard,
  ShieldAlert,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  Scale,
  Clock,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"

type HelpTab = "shortcuts" | "regulatory" | "support"

export function HelpModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<HelpTab>("shortcuts")

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        aria-describedby="help-modal-desc"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="help-modal-title" className="text-base font-bold text-slate-900">
                Centre d'Aide & Référence LAKANA
              </h2>
              <p id="help-modal-desc" className="text-xs text-slate-500">
                Conformité LBC/FT/FP • Réglementation UEMOA & CENTIF Mali
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            aria-label="Fermer le centre d'aide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-slate-100 px-6">
          {[
            { id: "shortcuts" as const, label: "Raccourcis Clavier", icon: Keyboard },
            { id: "regulatory" as const, label: "Mémento Réglementaire", icon: Scale },
            { id: "support" as const, label: "Assistance & Support SFD", icon: PhoneCall },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition cursor-pointer",
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Contenu */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {activeTab === "shortcuts" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Ces raccourcis vous permettent de naviguer rapidement dans le système sans quitter les mains du clavier.
              </p>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between p-3">
                  <span className="text-xs font-medium text-slate-700">Ouvrir la recherche universelle (Palette)</span>
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono font-semibold text-slate-600 shadow-2xs">
                    ⌘ K / Ctrl + K
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-xs font-medium text-slate-700">Fermer la fenêtre / modale active</span>
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono font-semibold text-slate-600 shadow-2xs">
                    Échap (Escape)
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-xs font-medium text-slate-700">Afficher ce Centre d'Aide</span>
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono font-semibold text-slate-600 shadow-2xs">
                    ?
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-xs font-medium text-slate-700">Naviguer dans les résultats de liste</span>
                  <kbd className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-mono font-semibold text-slate-600 shadow-2xs">
                    ↑ / ↓ / Entrée
                  </kbd>
                </div>
              </div>
            </div>
          )}

          {activeTab === "regulatory" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <ShieldAlert className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Cadre LBC/FT/FP — SFD & Institutions Financières (Mali / UEMOA)</span>
                </div>
                <p className="mt-1 text-xs text-indigo-700">
                  Conforme à la Directive n° 02/2015/CM/UEMOA et aux instructions de la BCEAO régissant les Systèmes Financiers Décentralisés.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Seuil Espèces Légal</span>
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">5 000 000 FCFA</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Toute opération unitaire ou fractionnée en espèces égale ou supérieure à ce seuil requiert une déclaration de transaction importante (DTI).
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Fractionnement (Smurfing)</span>
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">Fenêtre 48h</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Surveillance automatique des dépôts successifs sous le seuil sur une période glissante de 48 heures.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Déclaration de Soupçon (DOS)</span>
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">CENTIF Mali</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Transmission confidentielle sans délai après confirmation de soupçon par le Responsable Conformité (MLRO).
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Traçabilité & Audit</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">SHA-256</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Chaque action, clôture ou qualification est scellée cryptographiquement dans le journal d'audit infalsifiable.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "support" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Environnement Opérationnel Validé</h4>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Système synchronisé avec la base locale SFD Bamako. Vos actions locales sont sécurisées et synchronisées en temps réel.
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                <h4 className="text-xs font-bold text-slate-900">Contacts Utiles & Hotline</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="font-semibold text-slate-900">Cellule Conformité AML :</span>
                    <p className="text-slate-500">conformite@sfd.ml</p>
                    <p className="text-slate-500">+223 20 22 00 00</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Support Technique LAKANA :</span>
                    <p className="text-slate-500">support@lakana.dev</p>
                    <p className="text-slate-500">Du Lundi au Vendredi (7h30 - 17h00 GMT)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3">
          <span className="text-[11px] text-slate-400">
            LAKANA v2.4 • Conforme normes CENTIF & BCEAO
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  )
}

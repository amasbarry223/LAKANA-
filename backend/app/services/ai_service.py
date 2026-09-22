import logging
from typing import List, Optional, Dict, Any
from app.schemas.ai import AIExplainResponse, AIChatResponse, AIContextResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Assistant IA explicatif contextuel d'aide à l'analyse (IA-01, IA-02, IA-03, IA-04)."""

    def explain_alert(
        self,
        client_nom: str,
        score: int,
        facteurs: List[str],
        client_code: Optional[str] = None,
        anomaly_score: Optional[float] = None,
        predicted_risk: Optional[str] = None,
        features_detail: Optional[Dict[str, Any]] = None,
    ) -> AIExplainResponse:
        code_str = f" ({client_code})" if client_code else ""

        # Détermination de la qualification de risque
        if score >= 70:
            qualif = "élevé"
            priorite = "Priorité Haute — Examen approfondi immédiat. Mesure conservatoire et possible Déclaration de Soupçon CENTIF-Mali sous 48h"
            badge_icon = "🔴"
            recommandation_action = "1. Geler à titre conservatoire les opérations sortantes non dénouées.\n2. Exiger les pièces justificatives d'origine des fonds (factures, bordereaux de livraison, actes notariés).\n3. Transmettre le dossier au Responsable Conformité pour instruction de déclaration CENTIF."
        elif score >= 40:
            qualif = "moyen"
            priorite = "Priorité Moyenne — Surveillance renforcée et vérification des justificatifs économiques"
            badge_icon = "🟡"
            recommandation_action = "1. Mettre le compte sous surveillance renforcée (seuil d'alerte abaissé à 500 000 FCFA).\n2. Prendre contact avec le gestionnaire de compte de l'agence pour clarifier l'activité récente.\n3. Vérifier la cohérence de l'enrôlement KYC."
        else:
            qualif = "faible"
            priorite = "Priorité Faible — Risque maîtrisé, contrôle périodique standard"
            badge_icon = "🟢"
            recommandation_action = "1. Poursuivre le traitement normal des transactions.\n2. Réévaluation automatique du score selon le calendrier semestriel réglementaire."

        # Analyse catégorielle des facteurs transmis (IA-02)
        facteurs_fractionnement = [f for f in facteurs if "fractionnement" in f.lower() or "seuil" in f.lower()]
        facteurs_sanctions = [f for f in facteurs if "sanction" in f.lower() or "ppe" in f.lower()]
        facteurs_volume = [f for f in facteurs if "volume" in f.lower() or "montant" in f.lower()]
        facteurs_ia = [f for f in facteurs if "[ia" in f.lower() or "atypique" in f.lower() or "anomalie" in f.lower()]
        autres_facteurs = [f for f in facteurs if f not in facteurs_fractionnement + facteurs_sanctions + facteurs_volume + facteurs_ia]

        lignes_facteurs = "\n".join([f"  • {f}" for f in facteurs]) if facteurs else "  • Aucun facteur aggravant spécifique détecté."

        # Évaluation contextuelle des features ML si fournies
        diagnostic_ml = ""
        if anomaly_score is not None:
            pct_anomalie = int(anomaly_score * 100)
            if anomaly_score >= 0.65:
                interpretation = "Profil hautement anormal : divergence majeure par rapport au comportement médian des sociétaires de microfinance UEMOA."
            elif anomaly_score >= 0.40:
                interpretation = "Profil modérément atypique : présence d'irrégularités statistiques nécessitant une vigilance circonstanciée."
            else:
                interpretation = "Profil conforme : flux compatibles avec la distribution attendue des sociétaires sains."

            diagnostic_ml = (
                f"\n\n🤖 ANALYSE PRÉDICTIVE IA (Isolation Forest & Random Forest) :\n"
                f"  - Score d'atypisme multidimensionnel : {anomaly_score:.2f} / 1.00 ({pct_anomalie}% d'anomalie)\n"
                f"  - Risque statistique prédit : {predicted_risk or qualif.capitalize()}\n"
                f"  - Diagnostic statistique : {interpretation}"
            )
            if features_detail:
                diagnostic_ml += f"\n  - Données clés analysées : {len(features_detail)} features comportementales ingérées."

        # Synthèse analytique globale rédigée en langage clair et percutant
        synthese = (
            f"{badge_icon} SYNTHÈSE ANALYTIQUE CONFORMITÉ LAKANA\n"
            f"Client audité : {client_nom}{code_str}\n"
            f"Risk Score : {score}/100 — Catégorisation : RISQUE {qualif.upper()}\n\n"
            f"📌 Facteurs déterminants et signaux d'alerte détectés :\n"
            f"{lignes_facteurs}"
            f"{diagnostic_ml}\n\n"
            f"📋 Conduite à tenir recommandée :\n"
            f"Statut opérationnel : {priorite}\n"
            f"{recommandation_action}\n\n"
            f"⚖️ Cadre réglementaire de référence :\n"
            f"Instruction BCEAO n°003-03-2025 relative à la LBC/FT/FP dans les SFD et dispositions CENTIF-Mali (Loi uniforme UEMOA)."
        )

        points_cles = [
            f"Score de risque consolidé : {score}/100 ({qualif.capitalize()})",
            f"{len(facteurs)} signal(aux) réglementaire(s) et comportemental(aux) actif(s)",
            "Conforme aux exigences BCEAO (Instruction n°003-03-2025) & CENTIF-Mali",
        ]

        if anomaly_score is not None:
            points_cles.append(f"Score anomalie IA : {int(anomaly_score * 100)}% d'écart au profil standard")

        if facteurs_fractionnement:
            points_cles.append("Signalement fractionnement : transactions multiples sous le seuil de déclaration de 1M FCFA")

        if facteurs_sanctions:
            points_cles.append("Vigilance accrue : correspondance sur liste de sanctions ou exposition politique (PPE)")

        return AIExplainResponse(
            synthese=synthese,
            points_cles=points_cles,
            rappel_conformite="⚠️ Rappel réglementaire (IA-03) : Ce rapport généré par l'IA constitue une aide à la décision. La décision finale d'investigation, de gel de fonds ou de déclaration de soupçon CENTIF revient exclusivement à l'analyste conformité habilité.",
            source_moteur="Moteur Hybride LAKANA (Règles Métier BCEAO + Modèles IA Scikit-Learn)",
        )

    def handle_chat(self, db: Session, message: str) -> AIChatResponse:
        """
        Moteur d'intention et de réponse contextuelle dynamique (100% basé sur la BDD et règles BCEAO).
        """
        import re
        from app.models.client import Client
        from app.models.alert import Alert
        from app.models.investigation import Investigation
        from app.models.transaction import Transaction
        from app.services.scoring_service import scoring_service
        from app.services.structuring_service import structuring_service
        from app.services.filtering_service import normalize_text
        from app.ml.feature_engineering import extract_features, features_to_vector
        from app.ml.predictor import predict_anomaly, models_are_ready

        q = message.strip()
        q_norm = normalize_text(q)
        reminder = "\n\n⚠️ Rappel : la décision finale revient à l'analyste habilité (IA-03)."

        # ── 1. INTENT_EXPLAIN_CLIENT : recherche d'un client spécifique ───────────
        target_client = None

        # Recherche par code client
        match_code = re.search(r"CLI-?\d+", q, re.IGNORECASE)
        if match_code:
            code_str = match_code.group(0).upper()
            if "-" not in code_str:
                code_str = code_str.replace("CLI", "CLI-")
            target_client = db.query(Client).filter(Client.code_client.ilike(f"%{code_str}%")).first()

        # Recherche par nom ou prénom
        if not target_client:
            clients = db.query(Client).all()
            longest_len = 0
            for c in clients:
                c_nom = normalize_text(c.nom)
                c_prenom = normalize_text(c.prenom or "")
                full_1 = f"{c_nom} {c_prenom}".strip()
                full_2 = f"{c_prenom} {c_nom}".strip()

                if (full_1 and full_1 in q_norm) or (full_2 and full_2 in q_norm):
                    target_client = c
                    break
                if c_nom and len(c_nom) >= 3 and c_nom in q_norm:
                    if len(c_nom) > longest_len:
                        longest_len = len(c_nom)
                        target_client = c
                elif c_prenom and len(c_prenom) >= 4 and c_prenom in q_norm:
                    if len(c_prenom) > longest_len:
                        longest_len = len(c_prenom)
                        target_client = c

        if target_client:
            # Calcul dynamique du Risk Score et des features ML
            score_data = scoring_service.calculate_score(db, target_client)
            feats = extract_features(db, target_client)
            vec = features_to_vector(feats)
            pred = predict_anomaly(vec)

            anomaly_score = pred.get("anomaly_score", 0.0)
            pred_risk = pred.get("predicted_risk", target_client.niveau_risque)

            # Explication détaillée via explain_alert
            explain_res = self.explain_alert(
                client_nom=target_client.nom,
                score=score_data["score"],
                facteurs=score_data["facteurs"],
                client_code=target_client.code_client,
                anomaly_score=anomaly_score,
                predicted_risk=pred_risk,
                features_detail=feats,
            )

            # Construction du contexte client pour la sidebar du frontend
            tx_count = db.query(Transaction).filter(Transaction.client_id == target_client.id).count()
            context_client = {
                "id": target_client.id,
                "nom": target_client.nom,
                "prenom": target_client.prenom or "",
                "code_client": target_client.code_client,
                "risk_score": score_data["score"],
                "niveau_risque": score_data["niveau_risque"],
                "facteurs": score_data["facteurs"],
                "decomposition": score_data["decomposition"],
                "transactions_count": tx_count,
                "est_ppe": target_client.est_ppe,
                "profession": target_client.profession,
            }

            suggestions = [
                f"Quelles sont les transactions de {target_client.nom} ?",
                f"Y a-t-il du fractionnement pour {target_client.nom} ?",
                "Quels sont les autres clients à risque élevé ?",
            ]

            return AIChatResponse(
                response=explain_res.synthese,
                intent="EXPLAIN_CLIENT",
                suggestions=suggestions,
                context_client=context_client,
                points_cles=explain_res.points_cles,
                source_moteur="Moteur Hybride LAKANA (Règles Métier BCEAO + Modèles IA Scikit-Learn)",
                rappel_conformite=explain_res.rappel_conformite,
            )

        # ── 2. INTENT_TOP_RISQUE : clients les plus risqués ───────────────────────
        if any(kw in q_norm for kw in ["plus risque", "top risque", "haut risque", "qui surveiller", "plus suspect", "plus dangereux", "critique"]):
            top_clients = db.query(Client).order_by(Client.risk_score.desc()).limit(5).all()
            if not top_clients:
                return AIChatResponse(
                    response="Aucun client n'est actuellement enregistré dans la base de données.",
                    intent="TOP_RISQUE",
                    suggestions=["Comment enrôler un client ?", "État du système"],
                )

            lines = ["🚨 **Clients nécessitant la plus haute vigilance (Top Risque)** :\n"]
            for i, c in enumerate(top_clients, start=1):
                badge = "🔴" if (c.risk_score or 0) >= 70 else "🟡" if (c.risk_score or 0) >= 40 else "🟢"
                ppe_tag = " [PPE]" if c.est_ppe else ""
                lines.append(f"{i}. {badge} **{c.nom} {c.prenom or ''}** ({c.code_client}){ppe_tag} — **Score : {c.risk_score or 0}/100** ({c.niveau_risque})")

            lines.append("\n💡 *Pour analyser un client en détail, demandez par exemple : 'Expliquer le score de " + top_clients[0].nom + "'.*")
            lines.append(reminder)

            suggestions = [f"Expliquer le score de {c.nom}" for c in top_clients[:3]]
            return AIChatResponse(
                response="\n".join(lines),
                intent="TOP_RISQUE",
                suggestions=suggestions,
            )

        # ── 3. INTENT_FRACTIONNEMENT : détection de structuring ───────────────────
        if any(kw in q_norm for kw in ["fractionnement", "structuring", "smurfing", "sous seuil", "seuil 1m", "1000000", "1 000 000"]):
            clients = db.query(Client).all()
            suspects = []
            for c in clients:
                seq = structuring_service.detect_structuring(db, c.id)
                if seq:
                    suspects.append((c, seq))

            if suspects:
                lines = [
                    f"⚠️ **Détection de Fractionnement (Structuring) — {len(suspects)} cas actif(s)** :\n",
                    "Le moteur LAKANA analyse en continu les opérations sous le seuil réglementaire de 1 000 000 FCFA sur fenêtre glissante de 48 heures (Règle R-FRC-01) :\n",
                ]
                for c, seq in suspects:
                    lines.append(
                        f"• 🔴 **{c.nom} {c.prenom or ''}** ({c.code_client}) : **{seq.count} transactions** cumulant **{seq.total_amount:,.0f} FCFA** sur {seq.window_hours}h."
                    )
                lines.append("\n📋 **Recommandation immédiate** : Ouvrir un dossier d'investigation formel et vérifier la justification économique des opérations.")
            else:
                lines = [
                    "✅ **Aucun cas de fractionnement sous le seuil détecté** sur les 48 dernières heures.",
                    "\nLe moteur surveille les transactions individuelles < 1 000 000 FCFA dont le cumul dépasse ce montant sur fenêtre glissante (Instruction BCEAO n°003-03-2025).",
                ]
            lines.append(reminder)

            suggestions = (
                [f"Expliquer le score de {c.nom}" for c, _ in suspects[:2]]
                if suspects
                else ["Quels sont les clients les plus risqués ?", "Statistiques globales des alertes"]
            )
            return AIChatResponse(
                response="\n".join(lines),
                intent="FRACTIONNEMENT",
                suggestions=suggestions,
            )

        # ── 4. INTENT_STATS : vue d'ensemble chiffrée de la conformité ────────────
        if any(kw in q_norm for kw in ["statistique", "stats", "combien d alerte", "chiffre", "taux", "vue d ensemble", "nombre de client", "synthese du jour"]):
            nb_clients = db.query(Client).count()
            nb_txs = db.query(Transaction).count()
            nb_alerts = db.query(Alert).count()
            bloquantes = db.query(Alert).filter(Alert.niveau == "bloquante").count()
            analyser = db.query(Alert).filter(Alert.niveau == "analyser").count()
            informatives = db.query(Alert).filter(Alert.niveau == "informative").count()
            inv_ouvertes = db.query(Investigation).filter(Investigation.status == "en_cours").count()
            inv_cloturees = db.query(Investigation).filter(Investigation.status == "cloturee").count()

            lines = [
                "📊 **Vue d'Ensemble Opérationnelle de la Conformité (Données Live)** :\n",
                f"• **Sociétaires enrôlés** : {nb_clients} clients ({db.query(Client).filter(Client.niveau_risque == 'Élevé').count()} en risque Élevé, {db.query(Client).filter(Client.est_ppe == True).count()} PPE)",
                f"• **Flux transactionnels surveillés** : {nb_txs} transactions en base",
                f"• **Centre d'alertes** : {nb_alerts} alertes générées au total",
                f"    - 🔴 Bloquantes : {bloquantes}",
                f"    - 🟡 À analyser : {analyser}",
                f"    - 🟢 Informatives : {informatives}",
                f"• **Investigations en cours** : {inv_ouvertes} dossier(s) actif(s) ({inv_cloturees} clôturé(s))",
                f"• **Statut Moteur IA** : {'Opérationnel (Isolation Forest + Random Forest)' if models_are_ready() else 'Entraînement requis'}",
                reminder,
            ]

            return AIChatResponse(
                response="\n".join(lines),
                intent="STATS",
                suggestions=[
                    "Quels sont les clients les plus risqués ?",
                    "Y a-t-il du fractionnement détecté ?",
                    "Quels dossiers d'investigation sont en cours ?",
                ],
            )

        # ── 5. INTENT_INVESTIGATION : dossiers et déclarations CENTIF ─────────────
        if any(kw in q_norm for kw in ["investigation", "dossier", "centif", "declaration de soupcon", "motif de cloture", "signalement"]):
            invs = db.query(Investigation).filter(Investigation.status == "en_cours").all()
            lines = [
                "📁 **Gestion des Dossiers d'Investigation LAKANA (INV-01 à 04)** :\n",
                f"Actuellement, **{len(invs)} dossier(s) d'investigation sont ouverts** et en cours d'instruction par les analystes.\n",
                "**Protocole réglementaire de traitement :**",
                "1. **Ouverture** : Déclenchée automatiquement sur alerte bloquante ou manuellement par l'analyste.",
                "2. **Collecte des pièces justificatives** : Factures, bons de commande, bordereaux de livraison, actes notariés.",
                "3. **Explication IA** : Consultation de la synthèse factuelle des facteurs de risque (IA-02).",
                "4. **Décision motivée obligatoire (INV-02)** : Aucun dossier ne peut être clos sans motif argumenté (Classé sans suite, Surveillance renforcée, ou Déclaration CENTIF sous 48h).",
                reminder,
            ]

            return AIChatResponse(
                response="\n".join(lines),
                intent="INVESTIGATION",
                suggestions=[
                    "Quels sont les clients les plus risqués ?",
                    "Statistiques globales des alertes",
                    "Comment motiver une clôture de dossier ?",
                ],
            )

        # ── 6. INTENT_SANCTIONS : filtrage listes et PPE ──────────────────────────
        if any(kw in q_norm for kw in ["sanction", "liste", "onu", "gafi", "ppe", "politiquement"]):
            lines = [
                "🔍 **Filtrage Sanctions & PPE LAKANA (FLT-01 à 04)** :\n",
                "Le système compare chaque client et bénéficiaire contre les listes officielles :",
                "• **Sources intégrées** : ONU, CENTIF-Mali, GAFI, Liste nationale PPE.",
                "• **Algorithme** : Fuzzy matching adapté aux patronymes ouest-africains (variantes phonétiques sahéliennes, gestion des consonnes géminées et voyelles nasales).",
                "• **Seuil d'alerte** : Toute similarité ≥ 80% déclenche une alerte de type 'Correspondance PPE/Sanctions'.",
                "• **Revue humaine obligatoire (FLT-04)** : Aucun blocage définitif de compte n'est effectué automatiquement.",
                reminder,
            ]
            return AIChatResponse(
                response="\n".join(lines),
                intent="SANCTIONS",
                suggestions=[
                    "Quels sont les clients les plus risqués ?",
                    "Y a-t-il du fractionnement détecté ?",
                ],
            )

        # ── 7. INTENT_GENERAL : Salutations & Présentation ────────────────────────
        top_c = db.query(Client).order_by(Client.risk_score.desc()).first()
        ex_client = f" '{top_c.nom}'" if top_c else " un client"

        lines = [
            "Bonjour 👋 Je suis l'**Assistant IA de LAKANA**.\n",
            "Je suis directement connecté à la base de données et aux moteurs réglementaires de votre institution. Je peux vous assister sur :",
            f"• **Analyse d'un sociétaire** : posez une question avec un nom ou un code (ex: *'Expliquer le score de{ex_client}'*).",
            "• **Détection de fractionnement** : vérifiez les tentatives de contournement du seuil de 1M FCFA (*'Y a-t-il du fractionnement ?'*).",
            "• **Priorités du jour** : identifiez les dossiers critiques (*'Quels sont les clients les plus risqués ?'*).",
            "• **Chiffres clés et conformité** : consultez l'état des alertes et dossiers (*'Statistiques des alertes'*).",
            reminder,
        ]

        default_suggestions = [
            f"Expliquer le score de {top_c.nom}" if top_c else "Quels sont les clients les plus risqués ?",
            "Quels sont les clients les plus risqués ?",
            "Y a-t-il du fractionnement détecté ?",
            "Statistiques des alertes",
        ]

        return AIChatResponse(
            response="\n".join(lines),
            intent="GENERAL",
            suggestions=default_suggestions,
        )

    def get_context(self, db: Session) -> AIContextResponse:
        """
        Retourne le contexte temps réel (top client à risque, alertes du jour, statut IA)
        pour alimenter dynamiquement le panneau latéral et les suggestions du frontend.
        """
        from app.models.client import Client
        from app.models.alert import Alert
        from app.models.transaction import Transaction
        from app.services.scoring_service import scoring_service
        from app.ml.predictor import models_are_ready

        # 1. Top client risqué
        top_client = db.query(Client).order_by(Client.risk_score.desc()).first()
        top_client_data = None
        if top_client:
            score_data = scoring_service.calculate_score(db, top_client)
            tx_count = db.query(Transaction).filter(Transaction.client_id == top_client.id).count()
            top_client_data = {
                "id": top_client.id,
                "nom": top_client.nom,
                "prenom": top_client.prenom or "",
                "code_client": top_client.code_client,
                "risk_score": score_data["score"],
                "niveau_risque": score_data["niveau_risque"],
                "facteurs": score_data["facteurs"],
                "decomposition": score_data["decomposition"],
                "transactions_count": tx_count,
                "est_ppe": top_client.est_ppe,
            }

        # 2. Statistiques alertes
        total_alerts = db.query(Alert).count()
        bloquantes = db.query(Alert).filter(Alert.niveau == "bloquante").count()
        analyser = db.query(Alert).filter(Alert.niveau == "analyser").count()
        informatives = db.query(Alert).filter(Alert.niveau == "informative").count()
        cloturees = db.query(Alert).filter(Alert.statut.in_(["cloturee", "classee"])).count()
        taux_res = round((cloturees / total_alerts * 100), 1) if total_alerts > 0 else 0.0

        stats_alertes = {
            "total": total_alerts,
            "bloquantes": bloquantes,
            "analyser": analyser,
            "informatives": informatives,
            "cloturees": cloturees,
            "taux_resolution": taux_res,
        }

        # 3. Statistiques clients
        total_clients = db.query(Client).count()
        stats_clients = {
            "total": total_clients,
            "eleve": db.query(Client).filter(Client.niveau_risque == "Élevé").count(),
            "moyen": db.query(Client).filter(Client.niveau_risque == "Moyen").count(),
            "faible": db.query(Client).filter(Client.niveau_risque == "Faible").count(),
        }

        # 4. Questions suggérées dynamiques
        suggested = []
        if top_client:
            suggested.append(f"Expliquer le score de {top_client.nom}")
        second_client = db.query(Client).filter(Client.id != (top_client.id if top_client else "")).order_by(Client.risk_score.desc()).first()
        if second_client:
            suggested.append(f"Pourquoi {second_client.nom} est-il surveillé ?")
        suggested.append("Y a-t-il du fractionnement détecté ?")
        suggested.append("Quels sont les clients les plus risqués ?")

        return AIContextResponse(
            top_client=top_client_data,
            stats_alertes=stats_alertes,
            stats_clients=stats_clients,
            models_ready=models_are_ready(),
            suggested_queries=suggested,
        )


ai_service = AIService()

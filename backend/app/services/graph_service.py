from typing import Dict, Any, List, Set
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models.client import Client
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.graph import FinancialGraphOut, GraphNode, GraphEdge


class GraphService:
    """Génération du graphe interactif des flux financiers (Client, Comptes, Bénéficiaires).
    
    Règles de coloration rouge (Alerte GRF) :
    1. Seuil journalier de 15 000 000 FCFA atteint dans la journée pour l'individu.
    2. OU montant supérieur à 2 fois ses transactions habituelles (moyenne historique).
    """

    SEUIL_JOURNALIER_ALERTE = 15_000_000.0  # 15 Millions FCFA dans la journée
    MULTIPLICATEUR_HABITUEL = 2.0           # 2x les transactions habituelles

    def build_client_graph(self, db: Session, client_id: str) -> FinancialGraphOut:
        client = db.query(Client).filter(Client.id == client_id).first()
        if not client:
            return FinancialGraphOut(
                client_id=client_id,
                client_nom="Inconnu",
                noeuds=[],
                liens=[],
                total_flux_detectes=0.0,
            )

        # 1. Récupération des transactions du client
        txs = (
            db.query(Transaction)
            .filter(Transaction.client_id == client_id)
            .order_by(Transaction.date_transaction.desc())
            .limit(50)
            .all()
        )

        # 2. Calcul du montant moyen habituel d'une transaction
        if txs:
            avg_habituelle = sum(t.montant for t in txs) / len(txs)
        else:
            avg_habituelle = 500_000.0  # Montant de référence par défaut

        seuil_deux_fois_habituel = self.MULTIPLICATEUR_HABITUEL * avg_habituelle

        # 3. Calcul des totaux par jour calendaire pour ce client
        totaux_par_jour: Dict[str, float] = defaultdict(float)
        for t in txs:
            if t.date_transaction:
                jour_key = t.date_transaction.strftime("%Y-%m-%d")
                totaux_par_jour[jour_key] += t.montant

        # Jours où le total journalier atteint ou dépasse 15 Millions FCFA
        jours_critiques_15m: Set[str] = {
            j for j, total in totaux_par_jour.items() if total >= self.SEUIL_JOURNALIER_ALERTE
        }
        has_reached_15m_day = len(jours_critiques_15m) > 0

        # Alerte sur le client lui-même si son cumul journalier a atteint 15M ou transaction > 2x habituel
        client_has_atypical_tx = any(t.montant > seuil_deux_fois_habituel for t in txs)
        client_alert = (
            client.risk_score >= 70
            or has_reached_15m_day
            or client_has_atypical_tx
        )

        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        node_ids = set()

        # Nœud central : le client
        client_node_id = f"cli_{client.id}"
        nom_affichage = (
            client.raison_sociale
            if client.type_client == "Entreprise" and client.raison_sociale
            else f"{client.nom} ({client.code_client})"
        )
        nodes.append(
            GraphNode(
                id=client_node_id,
                label=nom_affichage,
                type="client",
                x=400,
                y=250,
                alert=client_alert,
                details={
                    "score": client.risk_score,
                    "ppe": client.est_ppe,
                    "total_journalier_max": max(totaux_par_jour.values()) if totaux_par_jour else 0.0,
                    "avg_habituelle": round(avg_habituelle, 2),
                    "seuil_2x_habituel": round(seuil_deux_fois_habituel, 2),
                    "seuil_15m_atteint": has_reached_15m_day,
                },
            )
        )
        node_ids.add(client_node_id)

        # Comptes du client
        comptes = db.query(Account).filter(Account.client_id == client_id).all()
        for idx, cpt in enumerate(comptes):
            cpt_id = f"cpt_{cpt.id}"
            nodes.append(
                GraphNode(
                    id=cpt_id,
                    label=f"Cpte {cpt.numero_compte}",
                    type="compte",
                    x=250 + (idx * 300),
                    y=140,
                    alert=False,
                    details={"solde": cpt.solde, "devise": cpt.devise},
                )
            )
            node_ids.add(cpt_id)
            edges.append(
                GraphEdge(
                    from_node=client_node_id,
                    to_node=cpt_id,
                    label="Détention",
                    strong=False,
                )
            )

        # Aggrégation par bénéficiaire
        beneficiaires_data: Dict[str, Dict[str, Any]] = {}
        for t in txs:
            if t.beneficiaire_nom:
                b_nom = t.beneficiaire_nom.strip()
                if b_nom not in beneficiaires_data:
                    beneficiaires_data[b_nom] = {
                        "cumul": 0.0,
                        "max_unitaire": 0.0,
                        "dates": set(),
                    }
                beneficiaires_data[b_nom]["cumul"] += t.montant
                beneficiaires_data[b_nom]["max_unitaire"] = max(
                    beneficiaires_data[b_nom]["max_unitaire"], t.montant
                )
                if t.date_transaction:
                    beneficiaires_data[b_nom]["dates"].add(t.date_transaction.strftime("%Y-%m-%d"))

        total_flux = sum(b["cumul"] for b in beneficiaires_data.values())
        b_idx = 0

        for b_nom, b_info in beneficiaires_data.items():
            b_id = f"ben_{b_idx}"
            cumul = b_info["cumul"]
            max_unitaire = b_info["max_unitaire"]
            dates = b_info["dates"]

            # CONDITION 1 : Le seuil de transactions journalières de l'individu atteint 15 millions
            condition_15m_journalier = any(d in jours_critiques_15m for d in dates) or cumul >= self.SEUIL_JOURNALIER_ALERTE

            # CONDITION 2 : Montant supérieur à 2 fois les transactions habituelles de l'individu
            condition_deux_fois_habituel = (max_unitaire > seuil_deux_fois_habituel) or (cumul > seuil_deux_fois_habituel)

            # Déclenchement de la coloration rouge
            is_suspicious = (
                condition_15m_journalier
                or condition_deux_fois_habituel
                or any(kw in b_nom.lower() for kw in ["douteux", "signalé", "suspect"])
            )

            motif_alerte = []
            if condition_15m_journalier:
                motif_alerte.append("Seuil journalier de 15M FCFA atteint")
            if condition_deux_fois_habituel:
                motif_alerte.append(f"Montant > 2x transactions habituelles (> {seuil_deux_fois_habituel:,.0f} F)")

            nodes.append(
                GraphNode(
                    id=b_id,
                    label=b_nom,
                    type="beneficiaire",
                    x=120 + (b_idx * 170),
                    y=380,
                    alert=is_suspicious,
                    details={
                        "cumul": cumul,
                        "max_unitaire": max_unitaire,
                        "motif_alerte": " | ".join(motif_alerte) if motif_alerte else None,
                        "is_15m_journalier": condition_15m_journalier,
                        "is_2x_habituel": condition_deux_fois_habituel,
                    },
                )
            )

            # Lien vers le bénéficiaire
            parent_node = f"cpt_{comptes[0].id}" if comptes else client_node_id
            edges.append(
                GraphEdge(
                    from_node=parent_node,
                    to_node=b_id,
                    label=f"{cumul:,.0f} FCFA",
                    strong=is_suspicious,
                )
            )
            b_idx += 1

        return FinancialGraphOut(
            client_id=client.id,
            client_nom=f"{client.nom} {client.prenom or ''}".strip(),
            noeuds=nodes,
            liens=edges,
            total_flux_detectes=total_flux,
        )


graph_service = GraphService()

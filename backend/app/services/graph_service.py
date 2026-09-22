import math
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
                y=260,
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
            # Disposition des comptes au-dessus du client
            compte_x = 300 + (idx * 200) if len(comptes) > 1 else 400
            compte_y = 130
            nodes.append(
                GraphNode(
                    id=cpt_id,
                    label=f"Cpte {cpt.numero_compte}",
                    type="compte",
                    x=compte_x,
                    y=compte_y,
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
        num_b = len(beneficiaires_data)

        for b_idx, (b_nom, b_info) in enumerate(beneficiaires_data.items()):
            b_id = f"ben_{b_idx}"
            cumul = b_info["cumul"]
            max_unitaire = b_info["max_unitaire"]
            dates = b_info["dates"]

            condition_15m_journalier = any(d in jours_critiques_15m for d in dates) or cumul >= self.SEUIL_JOURNALIER_ALERTE
            condition_deux_fois_habituel = (max_unitaire > seuil_deux_fois_habituel) or (cumul > seuil_deux_fois_habituel)

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

            # Disposition aérée en deux couronnes concentriques équilibrées
            if num_b <= 6:
                angle = (math.pi * 0.85 * b_idx / max(num_b - 1, 1)) + math.pi * 0.08
                bx = round(400 + 260 * math.cos(angle + math.pi / 2))
                by = round(260 + 200 * math.sin(angle + math.pi / 2))
            else:
                is_outer = (b_idx % 2 == 1)
                radius_x = 340 if is_outer else 220
                radius_y = 280 if is_outer else 180
                step_angle = (2 * math.pi * b_idx) / num_b - math.pi / 2
                bx = round(400 + radius_x * math.cos(step_angle))
                by = round(260 + radius_y * math.sin(step_angle))


            nodes.append(
                GraphNode(
                    id=b_id,
                    label=b_nom,
                    type="beneficiaire",
                    x=bx,
                    y=by,
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

            parent_node = f"cpt_{comptes[0].id}" if comptes else client_node_id
            edges.append(
                GraphEdge(
                    from_node=parent_node,
                    to_node=b_id,
                    label=f"{cumul:,.0f} FCFA",
                    strong=is_suspicious,
                )
            )

        return FinancialGraphOut(
            client_id=client.id,
            client_nom=f"{client.nom} {client.prenom or ''}".strip(),
            noeuds=nodes,
            liens=edges,
            total_flux_detectes=total_flux,
        )

    def build_global_graph(self, db: Session, limit_clients: int = 15) -> FinancialGraphOut:
        """Génère la cartographie globale de tous les clients principaux, comptes et flux croisés."""
        # 1. Sélection des clients prioritaires (les plus risqués ou représentatifs)
        top_clients = (
            db.query(Client)
            .order_by(Client.risk_score.desc())
            .limit(limit_clients)
            .all()
        )

        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        existing_nodes: Set[str] = set()
        beneficiaires_seen: Dict[str, str] = {}  # nom -> node_id

        total_flux = 0.0
        n_clients = len(top_clients)

        # Disposition en cercle des clients autour du centre (500, 350)
        cx, cy, radius_clients = 500, 350, 260

        for idx, client in enumerate(top_clients):
            angle = (2 * math.pi * idx) / max(n_clients, 1)
            cli_x = round(cx + radius_clients * math.cos(angle))
            cli_y = round(cy + radius_clients * math.sin(angle))

            cli_id = f"cli_{client.id}"
            nom_affichage = client.nom if not client.prenom else f"{client.nom} {client.prenom}"
            if client.raison_sociale:
                nom_affichage = client.raison_sociale

            nodes.append(
                GraphNode(
                    id=cli_id,
                    label=nom_affichage,
                    type="client",
                    x=cli_x,
                    y=cli_y,
                    alert=client.risk_score >= 70,
                    details={
                        "score": client.risk_score,
                        "code": client.code_client,
                        "ppe": client.est_ppe,
                    },
                )
            )
            existing_nodes.add(cli_id)

            # Transactions récentes pour ce client
            txs = (
                db.query(Transaction)
                .filter(Transaction.client_id == client.id)
                .order_by(Transaction.date_transaction.desc())
                .limit(8)
                .all()
            )

            for t in txs:
                total_flux += t.montant
                if not t.beneficiaire_nom:
                    continue

                b_clean = t.beneficiaire_nom.strip()
                if b_clean not in beneficiaires_seen:
                    ben_id = f"ben_glob_{len(beneficiaires_seen)}"
                    # Positionner le bénéficiaire légèrement décalé vers l'extérieur ou l'intérieur
                    ben_angle = angle + (len(beneficiaires_seen) * 0.15)
                    ben_radius = radius_clients + 110 if len(beneficiaires_seen) % 2 == 0 else radius_clients - 90
                    bx = round(cx + ben_radius * math.cos(ben_angle))
                    by = round(cy + ben_radius * math.sin(ben_angle))

                    nodes.append(
                        GraphNode(
                            id=ben_id,
                            label=b_clean,
                            type="beneficiaire",
                            x=bx,
                            y=by,
                            alert=t.montant >= 5_000_000 or (client.risk_score >= 70 and t.montant >= 1_000_000),
                            details={"dernier_montant": t.montant},
                        )
                    )
                    beneficiaires_seen[b_clean] = ben_id
                    existing_nodes.add(ben_id)
                else:
                    ben_id = beneficiaires_seen[b_clean]

                edges.append(
                    GraphEdge(
                        from_node=cli_id,
                        to_node=ben_id,
                        label=f"{t.montant:,.0f} F",
                        strong=t.montant >= 5_000_000,
                    )
                )

        return FinancialGraphOut(
            client_id="GLOBAL",
            client_nom="Cartographie Réseau Global LAKANA",
            noeuds=nodes,
            liens=edges,
            total_flux_detectes=total_flux,
        )


graph_service = GraphService()


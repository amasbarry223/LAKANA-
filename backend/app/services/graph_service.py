from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.client import Client
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.graph import FinancialGraphOut, GraphNode, GraphEdge


class GraphService:
    """Génération du graphe interactif des flux financiers (Client, Comptes, Bénéficiaires)."""

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

        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        node_ids = set()

        # Nœud central : le client
        client_node_id = f"cli_{client.id}"
        nodes.append(
            GraphNode(
                id=client_node_id,
                label=f"{client.nom} ({client.code_client})",
                type="client",
                x=400,
                y=250,
                alert=client.risk_score >= 70,
                details={"score": client.risk_score, "ppe": client.est_ppe},
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

        # Transactions et bénéficiaires
        txs = db.query(Transaction).filter(Transaction.client_id == client_id).limit(30).all()
        beneficiaires_vus: Dict[str, float] = {}
        for t in txs:
            if t.beneficiaire_nom:
                beneficiaires_vus[t.beneficiaire_nom] = beneficiaires_vus.get(t.beneficiaire_nom, 0.0) + t.montant

        total_flux = sum(beneficiaires_vus.values())
        b_idx = 0
        for b_nom, cumul in beneficiaires_vus.items():
            b_id = f"ben_{b_idx}"
            is_suspicious = any(kw in b_nom.lower() for kw in ["diallo", "camara", "douteux", "signalé"]) or cumul >= 3_000_000
            nodes.append(
                GraphNode(
                    id=b_id,
                    label=b_nom,
                    type="beneficiaire",
                    x=150 + (b_idx * 160),
                    y=380,
                    alert=is_suspicious,
                    details={"cumul": cumul},
                )
            )
            # Lien depuis le 1er compte ou le client
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

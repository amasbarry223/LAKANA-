from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.core.config import settings


class StructuringSequence:
    def __init__(
        self,
        client_id: str,
        transactions: List[Transaction],
        total_amount: float,
        threshold: float,
        window_hours: int,
    ):
        self.client_id = client_id
        self.transactions = transactions
        self.total_amount = total_amount
        self.threshold = threshold
        self.window_hours = window_hours
        self.count = len(transactions)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "client_id": self.client_id,
            "tx_count": self.count,
            "total_montant": self.total_amount,
            "seuil_unitaire": self.threshold,
            "fenetre_heures": f"{self.window_hours}h",
            "transactions": [
                {
                    "ref": t.reference,
                    "montant": t.montant,
                    "date": t.date_transaction.strftime("%d/%m/%Y %H:%M"),
                    "type": t.type_operation,
                }
                for t in self.transactions
            ],
            "statut": "bloquante" if self.total_amount >= 3 * self.threshold else "analyser",
        }


class StructuringService:
    """Détection du fractionnement (transactions sous le seuil cumulant au-delà sur une fenêtre glissante)."""

    def detect_structuring(
        self,
        db: Session,
        client_id: str,
        threshold: Optional[float] = None,
        window_hours: Optional[int] = None,
    ) -> Optional[StructuringSequence]:
        threshold = threshold or settings.SEUIL_DECLARATION_CENTIF
        window_hours = window_hours or settings.FENETRE_FRACTIONNEMENT_HEURES

        # Récupération des transactions récentes du client
        since = datetime.utcnow() - timedelta(hours=window_hours)
        txs = (
            db.query(Transaction)
            .filter(
                Transaction.client_id == client_id,
                Transaction.date_transaction >= since,
            )
            .order_by(Transaction.date_transaction.asc())
            .all()
        )

        if not txs:
            return None

        # Transactions individuellement sous le seuil (ex: entre 500k et 999 999 FCFA)
        sub_threshold_txs = [t for t in txs if t.montant < threshold and t.montant >= 0.5 * threshold]
        
        # On vérifie aussi l'ensemble des transactions sous le seuil
        total_sub = sum(t.montant for t in sub_threshold_txs)

        # Si au moins 2 transactions proches du seuil et total cumulé dépasse le seuil
        if len(sub_threshold_txs) >= 2 and total_sub >= threshold:
            return StructuringSequence(
                client_id=client_id,
                transactions=sub_threshold_txs,
                total_amount=total_sub,
                threshold=threshold,
                window_hours=window_hours,
            )

        # Vérification avec toutes les transactions sous le seuil si cumul >= seuil et count >= 3
        all_under = [t for t in txs if t.montant < threshold]
        total_all_under = sum(t.montant for t in all_under)
        if len(all_under) >= 3 and total_all_under >= threshold:
            return StructuringSequence(
                client_id=client_id,
                transactions=all_under,
                total_amount=total_all_under,
                threshold=threshold,
                window_hours=window_hours,
            )

        return None


structuring_service = StructuringService()

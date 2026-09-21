from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.transaction import Transaction


class DetectionService:
    """Analyse comportementale comparant l'activité récente à l'historique du client."""

    def analyze_behavior(self, db: Session, client_id: str) -> Dict[str, Any]:
        all_txs = (
            db.query(Transaction)
            .filter(Transaction.client_id == client_id)
            .order_by(Transaction.date_transaction.desc())
            .all()
        )

        if not all_txs:
            return {
                "volume_ratio": 1.0,
                "frequency_ratio": 1.0,
                "is_volume_atypical": False,
                "is_frequency_atypical": False,
                "points_volume": 0,
                "points_frequence": 0,
                "facteurs": [],
            }

        # Séparation récent (7 derniers jours) vs historique (> 7 jours)
        limit_date = datetime.utcnow() - timedelta(days=7)
        recent_txs = [t for t in all_txs if t.date_transaction >= limit_date]
        historic_txs = [t for t in all_txs if t.date_transaction < limit_date]

        facteurs: List[str] = []
        points_vol = 0
        points_freq = 0

        # S'il n'y a pas assez d'historique, on simule une référence
        if not historic_txs:
            avg_historic_amount = 450_000.0
            avg_historic_count_per_week = 2.0
        else:
            avg_historic_amount = sum(t.montant for t in historic_txs) / len(historic_txs)
            weeks = max(1.0, (datetime.utcnow() - historic_txs[-1].date_transaction).days / 7.0)
            avg_historic_count_per_week = len(historic_txs) / weeks

        avg_recent_amount = (sum(t.montant for t in recent_txs) / len(recent_txs)) if recent_txs else 0.0
        recent_count = len(recent_txs)

        vol_ratio = (avg_recent_amount / avg_historic_amount) if avg_historic_amount > 0 else 1.0
        freq_ratio = (recent_count / avg_historic_count_per_week) if avg_historic_count_per_week > 0 else 1.0

        # Règle Volume (max 25 pts)
        if vol_ratio >= 3.0:
            points_vol = 25
            facteurs.append(f"Volume de transaction moyen récent {vol_ratio:.1f}x supérieur à l'historique (+25 pts)")
        elif vol_ratio >= 2.0:
            points_vol = 15
            facteurs.append(f"Volume de transaction moyen récent {vol_ratio:.1f}x supérieur à l'historique (+15 pts)")

        # Règle Fréquence (max 20 pts)
        if freq_ratio >= 2.5:
            points_freq = 20
            facteurs.append(f"Fréquence de transactions {freq_ratio:.1f}x supérieure au profil habituel (+20 pts)")
        elif freq_ratio >= 1.8:
            points_freq = 12
            facteurs.append(f"Fréquence de transactions {freq_ratio:.1f}x supérieure au profil habituel (+12 pts)")

        return {
            "volume_ratio": round(vol_ratio, 2),
            "frequency_ratio": round(freq_ratio, 2),
            "montant_moyen_recent": round(avg_recent_amount, 2),
            "montant_moyen_historique": round(avg_historic_amount, 2),
            "points_volume": points_vol,
            "points_frequence": points_freq,
            "facteurs": facteurs,
        }


detection_service = DetectionService()

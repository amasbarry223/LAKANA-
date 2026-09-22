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

    def check_24h_15m_threshold(self, db: Session, client_id: str, new_amount: float) -> Optional[Dict[str, Any]]:
        """
        Règle 1 : Transaction >= 15 000 000 FCFA ou cumul des transactions en 24h >= 15 000 000 FCFA.
        Déclenche une alerte de type Opération de Montant Élevé (OME) pour déclaration CENTIF.
        """
        since = datetime.utcnow() - timedelta(hours=24)
        recent_txs = (
            db.query(Transaction)
            .filter(Transaction.client_id == client_id, Transaction.date_transaction >= since)
            .all()
        )
        cumul_24h = sum(t.montant for t in recent_txs) + new_amount
        if cumul_24h >= 15_000_000:
            return {
                "type": "Opération de montant élevé (≥ 15M FCFA)",
                "niveau": "bloquante" if new_amount >= 15_000_000 else "analyser",
                "module": "Seuil Réglementaire (15M FCFA)",
                "score": 90,
                "facteurs": [
                    f"Opération de {new_amount:,.0f} FCFA portant le cumul 24h à {cumul_24h:,.0f} FCFA (Seuil OME: 15 000 000 FCFA).",
                    "Déclaration obligatoire d'opération de montant élevé (Instruction BCEAO / CENTIF).",
                ],
                "cumul_24h": cumul_24h,
            }
        return None

    def check_atypical_amount(self, client: Any, amount: float) -> Optional[Dict[str, Any]]:
        """
        Règle 2 : Montant inhabituel et atypique comparé au revenu mensuel déclaré.
        """
        revenu = getattr(client, "revenu", 0.0) or 0.0
        if revenu > 0 and amount >= (revenu * 3.0) and amount >= 1_500_000:
            ratio = amount / revenu
            return {
                "type": "Montant inhabituel et atypique",
                "niveau": "analyser",
                "module": "Détection comportementale",
                "score": 75,
                "facteurs": [
                    f"Montant de {amount:,.0f} FCFA représentant {ratio:.1f}x le revenu mensuel déclaré ({revenu:,.0f} FCFA).",
                    "Écart significatif avec le profil économique KYC du sociétaire.",
                ],
            }
        return None

    def check_cashier_anomaly(self, operator: str, amount: float, tx_time: Optional[datetime] = None) -> Optional[Dict[str, Any]]:
        """
        Règle 3 : Opération inhabituelle de la caissière (horaires décalés ou montant au guichet hors norme).
        """
        now = tx_time or datetime.utcnow()
        # Contrôle horaires (ex: avant 07h30 ou après 18h30)
        hour = now.hour
        is_off_hours = hour < 7 or hour >= 19
        is_huge_cash = amount >= 10_000_000

        if is_off_hours or is_huge_cash:
            facteurs = []
            if is_off_hours:
                facteurs.append(f"Opération enregistrée par l'opérateur '{operator}' en dehors des heures ouvrées ({now.strftime('%H:%M')}).")
            if is_huge_cash:
                facteurs.append(f"Montant liquide exceptionnel de {amount:,.0f} FCFA au guichet sans double validation préalable.")
            
            return {
                "type": "Opération guichet inhabituelle",
                "niveau": "bloquante" if is_huge_cash else "analyser",
                "module": "Contrôle Interne Caisse",
                "score": 80,
                "facteurs": facteurs,
            }
        return None

    def check_multi_account_structuring(self, db: Session, client_id: str, dest_account_num: Optional[str], amount: float) -> Optional[Dict[str, Any]]:
        """
        Règle 4 : Transaction entre plusieurs comptes appartenant au même client (mouvements croisés).
        """
        if not dest_account_num:
            return None

        from app.models.account import Account
        # Vérifier si le compte de destination appartient également au même client
        dest_acc = db.query(Account).filter(Account.numero_compte == dest_account_num).first()
        if dest_acc and dest_acc.client_id == client_id:
            # Transfert interne entre comptes du même sociétaire
            if amount >= 1_000_000:
                return {
                    "type": "Flux croisés multi-comptes même titulaire",
                    "niveau": "analyser",
                    "module": "Fractionnement",
                    "score": 70,
                    "facteurs": [
                        f"Transfert de {amount:,.0f} FCFA entre deux comptes distincts du même sociétaire (Compte source -> {dest_account_num}).",
                        "Suspicion de virement circulaire ou d'éclatement pour contournement des plafonds de solde.",
                    ],
                }
        return None


detection_service = DetectionService()


"""
LAKANA — Feature Engineering
Extraction des 14 features comportementales par client pour l'entraînement et la prédiction.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from sqlalchemy.orm import Session

from app.models.client import Client
from app.models.transaction import Transaction
from app.core.config import settings


# ─── Constantes ──────────────────────────────────────────────────────────────

SEUIL = settings.SEUIL_DECLARATION_CENTIF           # 1 000 000 FCFA
SEUIL_FRACTIONNEMENT_MIN = 0.50 * SEUIL             # 500 000 FCFA
SEUIL_FRACTIONNEMENT_MAX = 0.999 * SEUIL            # 999 900 FCFA


# ─── Noms de features (ordre stable pour le modèle) ──────────────────────────

FEATURE_NAMES: List[str] = [
    "avg_amount_7d",           # Montant moyen sur 7 derniers jours
    "avg_amount_30d",          # Montant moyen sur 30 derniers jours
    "avg_amount_90d",          # Montant moyen sur 90 derniers jours (référence long terme)
    "tx_count_7d",             # Nombre de transactions sur 7j
    "tx_count_30d",            # Nombre de transactions sur 30j
    "ratio_amount_7d_vs_90d",  # Pic soudain de volume (>=2 → suspect)
    "ratio_freq_7d_vs_30d",    # Pic soudain de fréquence (>=2 → suspect)
    "max_single_tx_7d",        # Plus grosse transaction unique sur 7j
    "structuring_count_48h",   # Transactions dans la zone grise de fractionnement (48h)
    "structuring_total_48h",   # Montant cumulé des transactions en zone grise (48h)
    "unique_beneficiaries_7d", # Diversité des bénéficiaires (transferts vers beaucoup d'inconnus)
    "nb_comptes",              # Nombre de comptes ouverts (multi-compte = signal)
    "is_ppe",                  # PPE (Personne Politiquement Exposée) : 1 ou 0
    "nb_alertes_actives",      # Nombre d'alertes non résolues
]


def _avg(lst: list) -> float:
    return sum(lst) / len(lst) if lst else 0.0


def extract_features(db: Session, client: Client) -> Dict[str, float]:
    """
    Extrait le vecteur de features pour un client donné.
    Retourne un dict {feature_name: valeur}.
    """
    now = datetime.utcnow()
    d7 = now - timedelta(days=7)
    d30 = now - timedelta(days=30)
    d90 = now - timedelta(days=90)
    d48h = now - timedelta(hours=48)

    # Charger toutes les transactions du client (déjà eager-loaded si appelé depuis scoring)
    txs_all: List[Transaction] = (
        db.query(Transaction)
        .filter(Transaction.client_id == client.id)
        .order_by(Transaction.date_transaction.asc())
        .all()
    )

    txs_7d = [t for t in txs_all if t.date_transaction >= d7]
    txs_30d = [t for t in txs_all if t.date_transaction >= d30]
    txs_90d = [t for t in txs_all if t.date_transaction >= d90]
    txs_48h = [t for t in txs_all if t.date_transaction >= d48h]

    # ── Features de volume ────────────────────────────────────────────────────
    avg_amount_7d = _avg([t.montant for t in txs_7d])
    avg_amount_30d = _avg([t.montant for t in txs_30d])
    avg_amount_90d = _avg([t.montant for t in txs_90d])
    max_single_tx_7d = max((t.montant for t in txs_7d), default=0.0)

    # Ratio pic de volume : combien de fois le niveau 7j dépasse la référence 90j
    ratio_amount_7d_vs_90d = (avg_amount_7d / avg_amount_90d) if avg_amount_90d > 0 else 1.0

    # ── Features de fréquence ─────────────────────────────────────────────────
    tx_count_7d = len(txs_7d)
    tx_count_30d = len(txs_30d)

    # Fréquence normalisée : nb tx / 7j vs nb tx moyen par 7j sur le mois
    avg_count_per_7d_in_30 = tx_count_30d / 4.0  # 30j ≈ 4 semaines
    ratio_freq_7d_vs_30d = (tx_count_7d / avg_count_per_7d_in_30) if avg_count_per_7d_in_30 > 0 else 1.0

    # ── Fractionnement (zone grise CENTIF) ───────────────────────────────────
    structuring_txs = [
        t for t in txs_48h
        if SEUIL_FRACTIONNEMENT_MIN <= t.montant < SEUIL
    ]
    structuring_count_48h = len(structuring_txs)
    structuring_total_48h = sum(t.montant for t in structuring_txs)

    # ── Diversité des bénéficiaires ───────────────────────────────────────────
    beneficiaires_7d = {
        t.beneficiaire_nom for t in txs_7d if t.beneficiaire_nom
    }
    unique_beneficiaries_7d = float(len(beneficiaires_7d))

    # ── Features de profil ────────────────────────────────────────────────────
    nb_comptes = float(len(client.comptes)) if client.comptes is not None else 0.0
    is_ppe = 1.0 if client.est_ppe else 0.0

    # ── Alertes actives ───────────────────────────────────────────────────────
    nb_alertes_actives = float(
        len([a for a in (client.alertes or []) if getattr(a, "statut", "") in ("ouverte", "en_cours")])
    )

    return {
        "avg_amount_7d": round(avg_amount_7d, 2),
        "avg_amount_30d": round(avg_amount_30d, 2),
        "avg_amount_90d": round(avg_amount_90d, 2),
        "tx_count_7d": float(tx_count_7d),
        "tx_count_30d": float(tx_count_30d),
        "ratio_amount_7d_vs_90d": round(ratio_amount_7d_vs_90d, 4),
        "ratio_freq_7d_vs_30d": round(ratio_freq_7d_vs_30d, 4),
        "max_single_tx_7d": round(max_single_tx_7d, 2),
        "structuring_count_48h": float(structuring_count_48h),
        "structuring_total_48h": round(structuring_total_48h, 2),
        "unique_beneficiaries_7d": unique_beneficiaries_7d,
        "nb_comptes": nb_comptes,
        "is_ppe": is_ppe,
        "nb_alertes_actives": nb_alertes_actives,
    }


def features_to_vector(features: Dict[str, float]) -> list:
    """Convertit le dict features en vecteur ordonné selon FEATURE_NAMES."""
    return [features.get(name, 0.0) for name in FEATURE_NAMES]


def explain_anomalous_features(
    features: Dict[str, float],
    anomaly_score: float,
) -> List[str]:
    """
    Génère des explications en langage naturel pour les features anormales.
    Retourne une liste de facteurs à inclure dans l'explication IA.
    """
    facteurs = []

    if features.get("ratio_amount_7d_vs_90d", 1.0) >= 3.0:
        x = features["ratio_amount_7d_vs_90d"]
        facteurs.append(
            f"Volume récent {x:.1f}x supérieur au profil de référence (90 jours) — pic inhabituel"
        )
    elif features.get("ratio_amount_7d_vs_90d", 1.0) >= 2.0:
        x = features["ratio_amount_7d_vs_90d"]
        facteurs.append(
            f"Volume récent {x:.1f}x au-dessus de la moyenne historique"
        )

    if features.get("ratio_freq_7d_vs_30d", 1.0) >= 2.5:
        x = features["ratio_freq_7d_vs_30d"]
        facteurs.append(
            f"Fréquence de transactions {x:.1f}x supérieure au rythme habituel"
        )

    if features.get("structuring_count_48h", 0) >= 2:
        n = int(features["structuring_count_48h"])
        total = features.get("structuring_total_48h", 0)
        facteurs.append(
            f"Schéma de fractionnement potentiel : {n} transaction(s) dans la zone grise "
            f"(50%–99% du seuil CENTIF) sur 48h, cumul {total:,.0f} FCFA"
        )

    if features.get("unique_beneficiaries_7d", 0) >= 5:
        n = int(features["unique_beneficiaries_7d"])
        facteurs.append(
            f"Diversification anormale des bénéficiaires : {n} destinataires différents en 7 jours"
        )

    if features.get("max_single_tx_7d", 0) >= 0.9 * SEUIL:
        amt = features["max_single_tx_7d"]
        facteurs.append(
            f"Transaction unitaire proche du seuil de déclaration CENTIF : {amt:,.0f} FCFA"
        )

    if features.get("nb_comptes", 0) >= 3:
        n = int(features["nb_comptes"])
        facteurs.append(f"Détention de {n} comptes (indicateur de multi-compte)")

    if features.get("is_ppe", 0) == 1.0:
        facteurs.append("Client classé PPE (Personne Politiquement Exposée) — risque inhérent élevé")

    if anomaly_score >= 0.7 and not facteurs:
        facteurs.append(
            "Profil comportemental statistiquement atypique par rapport à l'ensemble des clients "
            "(détecté par le modèle d'anomalie — aucun facteur réglementaire isolé)"
        )

    return facteurs

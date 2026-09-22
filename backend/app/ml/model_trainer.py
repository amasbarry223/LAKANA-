"""
LAKANA — Entraîneur de Modèles ML & Générateur de Données Synthétiques UEMOA
Permet d'entraîner Isolation Forest (non supervisé) et Random Forest (supervisé).
"""
from __future__ import annotations

import logging
import random
from pathlib import Path
from typing import Dict, Any, List, Tuple

import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
from sqlalchemy.orm import Session

from app.models.client import Client
from app.ml.feature_engineering import FEATURE_NAMES, extract_features, features_to_vector
from app.ml.predictor import ISO_FOREST_PATH, RF_PATH, SCALER_PATH, MODELS_DIR, reload_models

logger = logging.getLogger(__name__)


# ─── Générateur de Données d'Entraînement Réalistes UEMOA/FCFA ───────────────

def generate_synthetic_profiles(count: int = 350) -> Tuple[np.ndarray, np.ndarray]:
    """
    Génère des vecteurs de features synthétiques réalistes calibrés sur l'écosystème SFD / UEMOA.
    Labels:
      0 = Faible (profil normal) ~ 70%
      1 = Moyen (atypique léger, volume ou fréquence modérés) ~ 20%
      2 = Élevé (fraude/fractionnement/blanchiment/PPE suspect) ~ 10%
    """
    X_list = []
    y_list = []

    for _ in range(count):
        profile_type = random.choices(["normal", "moyen", "suspect"], weights=[0.70, 0.20, 0.10])[0]

        if profile_type == "normal":
            # Client régulier SFD (commerçant, artisan, salarié)
            base_amount = random.uniform(50_000, 450_000)
            avg_90d = base_amount
            avg_30d = base_amount * random.uniform(0.85, 1.25)
            avg_7d = avg_30d * random.uniform(0.80, 1.30)
            
            tx_7d = random.randint(1, 4)
            tx_30d = tx_7d * random.randint(3, 5)

            ratio_amount = avg_7d / avg_90d if avg_90d > 0 else 1.0
            avg_count_weekly = tx_30d / 4.0
            ratio_freq = tx_7d / avg_count_weekly if avg_count_weekly > 0 else 1.0

            max_single_7d = avg_7d * random.uniform(1.0, 1.5)
            struct_count = 0.0
            struct_total = 0.0
            unique_benef = float(random.randint(1, 3))
            nb_comptes = float(random.choice([1, 1, 1, 2]))
            is_ppe = 0.0
            alertes = 0.0
            y = 0  # Faible

        elif profile_type == "moyen":
            # Client avec pic d'activité saisonnière ou activité accrue
            base_amount = random.uniform(300_000, 800_000)
            avg_90d = base_amount
            avg_30d = base_amount * random.uniform(1.2, 1.8)
            avg_7d = avg_30d * random.uniform(1.5, 2.3)

            tx_7d = random.randint(4, 9)
            tx_30d = random.randint(12, 25)

            ratio_amount = avg_7d / avg_90d if avg_90d > 0 else 1.5
            avg_count_weekly = tx_30d / 4.0
            ratio_freq = tx_7d / avg_count_weekly if avg_count_weekly > 0 else 1.4

            max_single_7d = random.uniform(600_000, 950_000)
            struct_count = float(random.choice([0, 1]))
            struct_total = struct_count * random.uniform(500_000, 850_000)
            unique_benef = float(random.randint(3, 6))
            nb_comptes = float(random.choice([1, 2, 3]))
            is_ppe = float(random.choices([0, 1], weights=[0.9, 0.1])[0])
            alertes = float(random.choice([0, 1]))
            y = 1  # Moyen

        else:
            # Pattern suspect (fractionnement massif, pic x4, PPE non déclaré, multi-comptes)
            base_amount = random.uniform(150_000, 400_000)
            avg_90d = base_amount
            avg_30d = base_amount * random.uniform(2.0, 3.5)
            avg_7d = base_amount * random.uniform(3.5, 7.0)

            tx_7d = random.randint(8, 20)
            tx_30d = random.randint(25, 60)

            ratio_amount = avg_7d / avg_90d if avg_90d > 0 else 4.0
            avg_count_weekly = tx_30d / 4.0
            ratio_freq = tx_7d / avg_count_weekly if avg_count_weekly > 0 else 2.8

            max_single_7d = random.uniform(900_000, 995_000)
            struct_count = float(random.randint(2, 6))
            struct_total = struct_count * random.uniform(700_000, 980_000)
            unique_benef = float(random.randint(6, 14))
            nb_comptes = float(random.choice([2, 3, 4, 5]))
            is_ppe = float(random.choices([0, 1], weights=[0.6, 0.4])[0])
            alertes = float(random.randint(1, 4))
            y = 2  # Élevé

        vec = [
            avg_7d, avg_30d, avg_90d,
            float(tx_7d), float(tx_30d),
            ratio_amount, ratio_freq,
            max_single_7d,
            struct_count, struct_total,
            unique_benef, nb_comptes,
            is_ppe, alertes
        ]
        X_list.append(vec)
        y_list.append(y)

    return np.array(X_list), np.array(y_list)


def train_models(db: Session, count_synthetic: int = 350) -> Dict[str, Any]:
    """
    Entraîne les modèles Isolation Forest et Random Forest sur :
    1. Données réelles extraites de la base
    2. Données synthétiques UEMOA pour la robustesse statistique
    Sauvegarde les modèles sérialisés sous `backend/app/ml/models/`.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Extraction des clients réels existants
    real_clients = db.query(Client).all()
    X_real = []
    y_real = []

    risk_mapping = {
        "Faible": 0,
        "Moyen": 1,
        "Élevé": 2,
        "eleve": 2,
    }

    for c in real_clients:
        try:
            feats = extract_features(db, c)
            vec = features_to_vector(feats)
            X_real.append(vec)
            y_label = risk_mapping.get(c.niveau_risque, 0)
            y_real.append(y_label)
        except Exception as err:
            logger.warning(f"Erreur extraction client {c.id}: {err}")

    # 2. Génération synthétique UEMOA
    X_synth, y_synth = generate_synthetic_profiles(count=count_synthetic)

    # Fusion des jeux de données
    if X_real:
        X_all = np.vstack([np.array(X_real), X_synth])
        y_all = np.concatenate([np.array(y_real), y_synth])
    else:
        X_all = X_synth
        y_all = y_synth

    # 3. Normalisation (StandardScaler)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_all)

    # 4. Entraînement Isolation Forest (Anomalies non supervisées)
    iso_forest = IsolationForest(
        n_estimators=150,
        contamination=0.12,  # Taux d'anomalie attendu en microfinance
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_scaled)

    # 5. Entraînement Random Forest (Prédiction supervisée du risque)
    rf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=7,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_scaled, y_all)

    # 6. Sauvegarde des modèles
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(iso_forest, ISO_FOREST_PATH)
    joblib.dump(rf_model, RF_PATH)

    # Recharger en mémoire
    reload_models()

    return {
        "status": "success",
        "total_samples": int(len(X_all)),
        "real_clients_count": len(X_real),
        "synthetic_samples": count_synthetic,
        "features_count": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "models_saved": [
            str(ISO_FOREST_PATH.name),
            str(RF_PATH.name),
            str(SCALER_PATH.name),
        ],
    }

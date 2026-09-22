"""
LAKANA — ML Predictor
Chargement lazy des modèles entraînés et prédiction temps-réel par client.
Isolation Forest (non supervisé) + RandomForest (supervisé).
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# ─── Chemins des modèles ─────────────────────────────────────────────────────

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

ISO_FOREST_PATH = MODELS_DIR / "isolation_forest.pkl"
RF_PATH = MODELS_DIR / "random_forest.pkl"
SCALER_PATH = MODELS_DIR / "scaler.pkl"


# ─── Chargement lazy ─────────────────────────────────────────────────────────

_iso_forest = None
_rf_model = None
_scaler = None
_models_loaded = False


def _load_models() -> bool:
    """Charge les modèles depuis le disque. Retourne True si succès."""
    global _iso_forest, _rf_model, _scaler, _models_loaded

    if _models_loaded:
        return True

    try:
        import joblib

        if ISO_FOREST_PATH.exists():
            _iso_forest = joblib.load(ISO_FOREST_PATH)
            logger.info("✅ Isolation Forest chargé.")

        if RF_PATH.exists():
            _rf_model = joblib.load(RF_PATH)
            logger.info("✅ RandomForest chargé.")

        if SCALER_PATH.exists():
            _scaler = joblib.load(SCALER_PATH)
            logger.info("✅ Scaler chargé.")

        _models_loaded = True
        return _iso_forest is not None

    except Exception as e:
        logger.warning(f"⚠️ Impossible de charger les modèles ML : {e}")
        _models_loaded = False
        return False


def models_are_ready() -> bool:
    """Vérifie si les modèles sont disponibles."""
    return ISO_FOREST_PATH.exists()


def reload_models():
    """Force le rechargement des modèles (après entraînement)."""
    global _models_loaded
    _models_loaded = False
    _load_models()


# ─── Prédiction ──────────────────────────────────────────────────────────────

def _normalize(vector: list) -> np.ndarray:
    """Applique le scaler si disponible, sinon retourne le vecteur brut."""
    arr = np.array(vector, dtype=float).reshape(1, -1)
    if _scaler is not None:
        try:
            arr = _scaler.transform(arr)
        except Exception:
            pass
    return arr


def predict_anomaly(feature_vector: list) -> Dict[str, Any]:
    """
    Prédit le niveau d'anomalie d'un client à partir de son vecteur de features.

    Returns:
        {
            "anomaly_score": float (0.0–1.0, plus élevé = plus anormal),
            "is_anomaly": bool,
            "predicted_risk": str ("Faible" | "Moyen" | "Élevé"),
            "confidence": float (0.0–1.0),
            "model_used": str,
            "fallback": bool,
        }
    """
    _load_models()

    X = _normalize(feature_vector)

    # ── Isolation Forest ─────────────────────────────────────────────────────
    anomaly_score = 0.0
    is_anomaly = False
    iso_confidence = 0.0
    model_used = "rules-only"

    if _iso_forest is not None:
        try:
            # decision_function : valeur négative = anomalie
            # score_samples : log-likelihood (plus bas = plus anormal)
            raw_score = float(_iso_forest.decision_function(X)[0])
            # Conversion en score 0.0–1.0 (1.0 = extrêmement anormal)
            # Les valeurs typiques vont de -0.5 (anomalie forte) à +0.5 (normal)
            anomaly_score = float(np.clip((0.5 - raw_score), 0.0, 1.0))
            is_anomaly = _iso_forest.predict(X)[0] == -1  # -1 = anomalie
            iso_confidence = min(abs(raw_score) * 2, 1.0)
            model_used = "isolation_forest"
        except Exception as e:
            logger.warning(f"Isolation Forest predict error: {e}")

    # ── RandomForest ─────────────────────────────────────────────────────────
    rf_predicted_risk: Optional[str] = None
    rf_proba: Optional[float] = None

    if _rf_model is not None:
        try:
            rf_label = _rf_model.predict(X)[0]
            rf_proba_arr = _rf_model.predict_proba(X)[0]
            rf_proba = float(max(rf_proba_arr))

            # Mapping label → niveau de risque
            label_map = {
                "Faible": "Faible",
                "Moyen": "Moyen",
                "Élevé": "Élevé",
                0: "Faible",
                1: "Moyen",
                2: "Élevé",
            }
            rf_predicted_risk = label_map.get(rf_label, str(rf_label))
            model_used = "isolation_forest+random_forest" if model_used == "isolation_forest" else "random_forest"
        except Exception as e:
            logger.warning(f"RandomForest predict error: {e}")

    # ── Synthèse du niveau de risque ─────────────────────────────────────────
    if rf_predicted_risk:
        predicted_risk = rf_predicted_risk
        confidence = rf_proba or 0.5
    else:
        # Fallback sur le score d'anomalie
        if anomaly_score >= 0.65:
            predicted_risk = "Élevé"
        elif anomaly_score >= 0.35:
            predicted_risk = "Moyen"
        else:
            predicted_risk = "Faible"
        confidence = iso_confidence

    # Cas sans modèle : fallback sur les règles seules
    fallback = _iso_forest is None and _rf_model is None

    return {
        "anomaly_score": round(anomaly_score, 4),
        "is_anomaly": bool(is_anomaly),
        "predicted_risk": predicted_risk,
        "confidence": round(confidence, 4),
        "model_used": model_used,
        "fallback": fallback,
    }

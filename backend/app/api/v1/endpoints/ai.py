from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.client import Client
from app.schemas.ai import (
    AIExplainRequest,
    AIExplainResponse,
    AIChatRequest,
    AIChatResponse,
    AIContextResponse,
)
from app.schemas.ml import MLPredictResponse, MLTrainResponse
from app.services.ai_service import ai_service
from app.ml.feature_engineering import extract_features, features_to_vector, explain_anomalous_features
from app.ml.predictor import predict_anomaly, models_are_ready
from app.ml.model_trainer import train_models

router = APIRouter()


@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(req: AIChatRequest, db: Session = Depends(get_db)):
    """
    Dialogue interactif contextuel avec l'Assistant IA LAKANA :
    Identifie l'intention, extrait les données réelles en BDD, applique les règles BCEAO/CENTIF
    et renvoie une réponse enrichie avec suggestions et contexte dynamique.
    """
    return ai_service.handle_chat(db=db, message=req.message)


@router.get("/context", response_model=AIContextResponse)
def get_assistant_context(db: Session = Depends(get_db)):
    """
    Fournit le contexte live pour alimenter la barre latérale et les questions suggérées de l'Assistant IA
    (top client risqué, alertes du jour, distribution de risque, statut des modèles ML).
    """
    return ai_service.get_context(db=db)


@router.post("/expliquer", response_model=AIExplainResponse)
def explain_alert_score(req: AIExplainRequest):
    """Explication contextuelle en langage clair de l'alerte et du niveau de risque."""
    return ai_service.explain_alert(
        client_nom=req.client_nom,
        score=req.risk_score,
        facteurs=req.facteurs,
        client_code=req.client_code,
        anomaly_score=req.anomaly_score,
        predicted_risk=req.predicted_risk,
    )


@router.post("/predict/{client_id}", response_model=MLPredictResponse)
def predict_client_ml(client_id: str, db: Session = Depends(get_db)):
    """
    Exécute le pipeline ML pour un client donné :
    1. Extraction des features comportementales
    2. Modèle Isolation Forest (anomalies) + Random Forest (classification)
    3. Explication IA des signaux faibles
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client avec l'identifiant {client_id} introuvable.",
        )

    feats = extract_features(db, client)
    vec = features_to_vector(feats)
    prediction = predict_anomaly(vec)

    anomaly_score = prediction.get("anomaly_score", 0.0)
    facteurs_ia = explain_anomalous_features(feats, anomaly_score)

    return MLPredictResponse(
        client_id=client.id,
        client_nom=client.nom,
        code_client=client.code_client,
        anomaly_score=anomaly_score,
        is_anomaly=prediction.get("is_anomaly", False),
        predicted_risk=prediction.get("predicted_risk", "Faible"),
        confidence=prediction.get("confidence", 0.5),
        model_used=prediction.get("model_used", "rules-only"),
        fallback=prediction.get("fallback", False),
        facteurs_ia=facteurs_ia,
        features=feats,
    )


@router.post("/train", response_model=MLTrainResponse)
def trigger_training(count_synthetic: int = 350, db: Session = Depends(get_db)):
    """
    Entraîne ou ré-entraîne les modèles IA (Isolation Forest + Random Forest)
    sur les données en base couplées aux données synthétiques calibrées UEMOA.
    """
    result = train_models(db, count_synthetic=count_synthetic)
    return MLTrainResponse(**result)


@router.get("/status")
def get_ai_status():
    """Vérifie si les modèles d'intelligence artificielle sont prêts et entraînés."""
    return {
        "models_ready": models_are_ready(),
        "engine": "Scikit-Learn (Isolation Forest + Random Forest)",
        "framework": "LAKANA AML AI Core",
        "supported_features": 14,
    }

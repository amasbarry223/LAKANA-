from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class MLPredictResponse(BaseModel):
    client_id: str
    client_nom: str
    code_client: Optional[str] = None
    anomaly_score: float
    is_anomaly: bool
    predicted_risk: str
    confidence: float
    model_used: str
    fallback: bool
    facteurs_ia: List[str]
    features: Dict[str, float]


class MLTrainResponse(BaseModel):
    status: str
    total_samples: int
    real_clients_count: int
    synthetic_samples: int
    features_count: int
    features: List[str]
    models_saved: List[str]

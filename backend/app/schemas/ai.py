from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class AIExplainRequest(BaseModel):
    client_nom: str
    client_code: Optional[str] = None
    risk_score: int
    facteurs: List[str]
    alerte_ref: Optional[str] = None
    anomaly_score: Optional[float] = None
    predicted_risk: Optional[str] = None


class AIExplainResponse(BaseModel):
    synthese: str
    points_cles: List[str]
    rappel_conformite: str = "⚠️ La décision finale de blocage ou de déclaration CENTIF revient exclusivement à l'analyste habilité (IA-03)."
    source_moteur: str = "LAKANA-Rules-Engine"


class AIChatRequest(BaseModel):
    message: str


class AIChatResponse(BaseModel):
    response: str
    intent: str
    suggestions: List[str]
    context_client: Optional[Dict[str, Any]] = None
    points_cles: Optional[List[str]] = None
    source_moteur: str = "Assistant IA LAKANA (Hybride Règles Métier + ML)"
    rappel_conformite: str = "⚠️ Rappel : la décision finale revient à l'analyste habilité (IA-03)."


class AIContextResponse(BaseModel):
    top_client: Optional[Dict[str, Any]] = None
    stats_alertes: Dict[str, Any]
    stats_clients: Dict[str, Any]
    models_ready: bool
    suggested_queries: List[str]

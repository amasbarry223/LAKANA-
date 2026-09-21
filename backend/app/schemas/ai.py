from typing import List, Optional
from pydantic import BaseModel


class AIExplainRequest(BaseModel):
    client_nom: str
    client_code: Optional[str] = None
    risk_score: int
    facteurs: List[str]
    alerte_ref: Optional[str] = None


class AIExplainResponse(BaseModel):
    synthese: str
    points_cles: List[str]
    rappel_conformite: str = "⚠️ La décision finale de blocage ou de déclaration CENTIF revient exclusivement à l'analyste habilité (IA-03)."
    source_moteur: str = "LAKANA-Rules-Engine"

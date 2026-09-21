from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AlertBase(BaseModel):
    reference: str
    client_id: str
    type_alerte: str
    niveau: str = "analyser"  # bloquante, analyser, informative
    score: int = 0
    module: str = "Risk Score"
    statut: str = "nouvelle"
    analyste: Optional[str] = None
    facteurs: List[Any] = []


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    statut: Optional[str] = None
    analyste: Optional[str] = None
    niveau: Optional[str] = None


class AlertOut(AlertBase):
    id: str
    created_at: datetime
    client_nom: Optional[str] = None
    client_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

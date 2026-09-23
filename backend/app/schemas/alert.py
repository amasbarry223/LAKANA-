from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


class AlertBase(BaseModel):
    reference: str
    client_id: str
    type_alerte: str
    niveau: str = "analyser"  # bloquante, analyser, informative
    score: int = 0
    module: str = "Risk Score"
    statut: str = "nouvelle"
    analyste: Optional[str] = None
    facteurs: List[str] = []

    @field_validator("facteurs", mode="before")
    @classmethod
    def normalize_facteurs(cls, v):
        if not v:
            return []
        if isinstance(v, str):
            try:
                import json
                v = json.loads(v)
            except Exception:
                return [v]
        if not isinstance(v, list):
            return [str(v)]
        res = []
        for item in v:
            if isinstance(item, dict):
                desc = item.get("description") or item.get("critere") or str(item)
                res.append(desc)
            elif item is not None:
                res.append(str(item))
        return res


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

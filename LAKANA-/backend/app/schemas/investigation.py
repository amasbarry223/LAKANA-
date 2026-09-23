from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class InvestigationBase(BaseModel):
    reference: str
    alerte_id: Optional[str] = None
    client_id: str
    analyste: str
    status: str = "en_cours"  # en_cours, cloturee, transmise
    type_motif: Optional[str] = None
    decision: Optional[str] = None
    notes_count: int = 1
    pieces_count: int = 0
    journal_notes: Optional[str] = None


class InvestigationCreate(InvestigationBase):
    pass


class InvestigationCloseRequest(BaseModel):
    status: str  # cloturee ou transmise
    decision: str  # Décision motivée obligatoire (INV-02)


class InvestigationOut(InvestigationBase):
    id: str
    date_ouverture: datetime
    date_cloture: Optional[datetime] = None
    client_nom: Optional[str] = None
    alerte_ref: Optional[str] = None
    score: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

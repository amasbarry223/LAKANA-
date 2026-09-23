from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SanctionEntryBase(BaseModel):
    code_entree: Optional[str] = None
    nom_complet: str
    aliases: Optional[str] = None
    liste_type: str  # ONU, GAFI, CENTIF, PPE
    liste_nom: str
    titre_fonction: Optional[str] = None
    nationalite: str = "Mali"
    
    # Champs réglementaires officiels canevas PPE
    agence: Optional[str] = "Agence Centrale Bamako"
    numero_compte: Optional[str] = None
    lieu_naissance: Optional[str] = None
    lieu_residence: Optional[str] = None


class SanctionEntryCreate(SanctionEntryBase):
    pass


class SanctionEntryOut(SanctionEntryBase):
    id: str
    date_inscription: datetime

    model_config = ConfigDict(from_attributes=True)


class MatchResult(BaseModel):
    nom_recherche: str
    nom_liste: str
    liste_nom: str
    liste_type: str
    similarite: float
    correspondance_detectee: bool
    motif: str
    code_entree: Optional[str] = None
    titre_fonction: Optional[str] = None


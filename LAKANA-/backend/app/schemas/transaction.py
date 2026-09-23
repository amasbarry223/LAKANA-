from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TransactionBase(BaseModel):
    reference: str
    client_id: str
    compte_source_id: Optional[str] = None
    numero_compte_expediteur: Optional[str] = None
    compte_destination_id: Optional[str] = None
    numero_compte_beneficiaire: Optional[str] = None
    beneficiaire_nom: Optional[str] = None
    montant: float = Field(gt=0, description="Montant de l'opération en FCFA")
    devise: str = "XOF"
    type_operation: str = "Dépôt"
    canal: str = "Guichet"
    description: Optional[str] = None
    
    # Champs réglementaires officiels
    numero_depot: Optional[str] = None
    agence: Optional[str] = "Agence Centrale Bamako"
    cause_operation: Optional[str] = None
    caractere: Optional[str] = "Habituel"
    operateur: Optional[str] = "Guichetier 01"


class TransactionCreate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: str
    date_transaction: datetime

    model_config = ConfigDict(from_attributes=True)

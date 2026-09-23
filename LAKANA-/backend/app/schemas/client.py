from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AccountBase(BaseModel):
    numero_compte: str
    type_compte: Optional[str] = "Courant"
    solde: Optional[float] = 0.0
    devise: Optional[str] = "XOF"


class AccountCreate(AccountBase):
    client_id: Optional[str] = None


class AccountOut(AccountBase):
    id: str
    client_id: str
    date_ouverture: datetime

    model_config = ConfigDict(from_attributes=True)


class ClientBase(BaseModel):
    code_client: str
    nom: str
    prenom: Optional[str] = None
    date_naissance: Optional[str] = None
    profession: Optional[str] = None
    ville: Optional[str] = "Bamako"
    pays: Optional[str] = "Mali"
    telephone: Optional[str] = None
    
    # Champs réglementaires officiels
    numero_compte: Optional[str] = None
    adresse_complete: Optional[str] = None
    agence: Optional[str] = "Agence Centrale Bamako"
    lieu_naissance: Optional[str] = None
    lieu_residence: Optional[str] = None

    # Type : "Particulier" ou "Entreprise"
    type_client: Optional[str] = "Particulier"

    # Entreprise
    raison_sociale: Optional[str] = None
    forme_juridique: Optional[str] = None
    rccm: Optional[str] = None
    nif: Optional[str] = None
    secteur_activite: Optional[str] = None
    beneficiaire_effectif: Optional[str] = None

    # Particulier & PPE
    piece_identite: Optional[str] = None
    est_ppe: Optional[bool] = False
    fonction_ppe: Optional[str] = None
    type_ppe: Optional[str] = None
    pays_mandat: Optional[str] = None

    niveau_risque: Optional[str] = "Faible"


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    profession: Optional[str] = None
    ville: Optional[str] = None
    telephone: Optional[str] = None
    type_client: Optional[str] = None
    raison_sociale: Optional[str] = None
    forme_juridique: Optional[str] = None
    rccm: Optional[str] = None
    nif: Optional[str] = None
    secteur_activite: Optional[str] = None
    beneficiaire_effectif: Optional[str] = None
    piece_identite: Optional[str] = None
    est_ppe: Optional[bool] = None
    fonction_ppe: Optional[str] = None
    type_ppe: Optional[str] = None
    pays_mandat: Optional[str] = None
    niveau_risque: Optional[str] = None
    risk_score: Optional[int] = None


class ClientOut(ClientBase):
    id: str
    risk_score: Optional[int] = 0
    created_at: Optional[datetime] = None
    comptes: List[AccountOut] = []

    model_config = ConfigDict(from_attributes=True)

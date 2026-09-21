from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.sanction import MatchResult, SanctionEntryOut
from app.models.sanction_list import SanctionEntry
from app.services.filtering_service import filtering_service

router = APIRouter()


@router.get("/verifier", response_model=List[MatchResult])
def check_name_against_lists(
    nom: str = Query(..., description="Nom complet à vérifier contre les listes sanctions et PPE"),
    seuil: Optional[float] = Query(None, description="Seuil de similarité minimum (ex: 75.0)"),
    db: Session = Depends(get_db),
):
    return filtering_service.match_name(db, nom_cherche=nom, threshold=seuil)


@router.get("/listes", response_model=List[SanctionEntryOut])
def list_sanction_entries(
    type_liste: Optional[str] = Query(None, description="ONU, GAFI, CENTIF ou PPE"),
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(SanctionEntry)
    if type_liste:
        q = q.filter(SanctionEntry.liste_type == type_liste.upper())
    return q.limit(limit).all()

from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientOut, ClientCreate, ClientUpdate
from app.repositories.client_repo import client_repository
from app.services.scoring_service import scoring_service
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[ClientOut])
def list_clients(
    q: Optional[str] = Query(None, description="Recherche par nom, prénom ou code client"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    if q:
        return client_repository.search_by_name(db, q, limit)
    return client_repository.get_multi(db, skip, limit)


@router.get("/{id}", response_model=ClientOut)
def get_client(id: str, db: Session = Depends(get_db)):
    client = client_repository.get_with_accounts(db, id)
    if not client:
        # Essai par code client
        client = client_repository.get_by_code(db, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return client


@router.post("", response_model=ClientOut, status_code=201)
def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    existing = client_repository.get_by_code(db, client_in.code_client)
    if existing:
        raise HTTPException(status_code=400, detail="Ce code client existe déjà")
    client = client_repository.create(db, client_in)
    
    # Audit log
    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else "Système",
        role=current_user.role if current_user else "Analyste",
        action="Création client",
        module="Client 360°",
        cible=client.code_client,
        details=f"Nouveau client enrôlé : {client.nom} {client.prenom or ''}",
    )
    return client


@router.get("/{id}/score")
def get_client_score(id: str, db: Session = Depends(get_db)):
    client = client_repository.get(db, id)
    if not client:
        client = client_repository.get_by_code(db, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return scoring_service.calculate_score(db, client)


@router.put("/{id}", response_model=ClientOut)
def update_client(
    id: str,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    client = client_repository.get(db, id)
    if not client:
        client = client_repository.get_by_code(db, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    updated = client_repository.update(db, client, client_in)
    return updated

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.investigation import Investigation
from app.models.alert import Alert
from app.models.client import Client
from app.schemas.investigation import InvestigationOut, InvestigationCreate, InvestigationCloseRequest
from app.repositories.investigation_repo import investigation_repository
from app.services.audit_service import audit_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[InvestigationOut])
def list_investigations(
    status: Optional[str] = Query(None, description="en_cours, cloturee, transmise, ou toutes"),
    db: Session = Depends(get_db),
):
    invs = investigation_repository.get_by_status(db, status)
    result = []
    for i in invs:
        out = InvestigationOut.model_validate(i)
        if i.client:
            out.client_nom = f"{i.client.nom} {i.client.prenom or ''}".strip()
            out.score = i.client.risk_score
        if i.alerte:
            out.alerte_ref = i.alerte.reference
        result.append(out)
    return result


@router.get("/{id}", response_model=InvestigationOut)
def get_investigation(id: str, db: Session = Depends(get_db)):
    inv = investigation_repository.get(db, id)
    if not inv:
        inv = investigation_repository.get_by_reference(db, id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation non trouvée")
    out = InvestigationOut.model_validate(inv)
    if inv.client:
        out.client_nom = f"{inv.client.nom} {inv.client.prenom or ''}".strip()
        out.score = inv.client.risk_score
    if inv.alerte:
        out.alerte_ref = inv.alerte.reference
    return out


@router.post("", response_model=InvestigationOut, status_code=201)
def create_investigation(
    inv_in: InvestigationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    inv = investigation_repository.create(db, inv_in)
    
    # Audit trail
    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else inv.analyste,
        role=current_user.role if current_user else "Analyste",
        action="Ouverture dossier d'investigation",
        module="Investigations",
        cible=inv.reference,
        details=f"Dossier ouvert pour motif : {inv.type_motif or 'Alerte'}",
    )
    return inv


@router.post("/{id}/close", response_model=InvestigationOut)
def close_investigation(
    id: str,
    req: InvestigationCloseRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    inv = investigation_repository.get(db, id)
    if not inv:
        inv = investigation_repository.get_by_reference(db, id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation non trouvée")

    if not req.decision.strip():
        raise HTTPException(
            status_code=400,
            detail="Une décision motivée et documentée est obligatoire pour clôturer une investigation (INV-02).",
        )

    updated = investigation_repository.close_investigation(
        db, inv, status=req.status, decision=req.decision
    )

    action_label = "Déclaration de soupçon transmise au CENTIF" if req.status == "transmise" else "Clôture d'investigation"
    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else inv.analyste,
        role=current_user.role if current_user else "Analyste conformité",
        action=action_label,
        module="Investigations",
        cible=inv.reference,
        details=f"Décision enregistrée : {req.decision[:100]}...",
    )
    return updated

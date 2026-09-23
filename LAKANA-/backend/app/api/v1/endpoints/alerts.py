from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.alert import Alert
from app.models.client import Client
from app.schemas.alert import AlertOut, AlertCreate, AlertUpdate
from app.repositories.alert_repo import alert_repository
from app.services.audit_service import audit_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[AlertOut])
def list_alerts(
    response: Response,
    statut: Optional[str] = Query(None),
    niveau: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    analyste: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Recherche texte : référence, type, module, analyste, client"),
    classification: Optional[str] = Query(
        None, description="Filtre métier prédéfini, ex: 'sanctions_ppe' pour les correspondances sanctions/PPE"
    ),
    order: str = Query("desc", description="Ordre de tri par date de création : 'asc' ou 'desc'"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    total = alert_repository.count_alerts(
        db, statut=statut, niveau=niveau, module=module, analyste=analyste, q=q, classification=classification
    )
    response.headers["X-Total-Count"] = str(total)
    alerts = alert_repository.filter_alerts(
        db,
        statut=statut,
        niveau=niveau,
        module=module,
        analyste=analyste,
        q=q,
        classification=classification,
        order=order,
        skip=skip,
        limit=limit,
    )
    result = []
    for a in alerts:
        out = AlertOut.model_validate(a)
        if a.client:
            out.client_nom = f"{a.client.nom} {a.client.prenom or ''}".strip()
            out.client_code = a.client.code_client
        result.append(out)
    return result


@router.get("/counts")
def get_alert_counts(db: Session = Depends(get_db)):
    return alert_repository.count_by_level(db)


@router.get("/{id}", response_model=AlertOut)
def get_alert(id: str, db: Session = Depends(get_db)):
    alert = alert_repository.get(db, id)
    if not alert:
        alert = alert_repository.get_by_reference(db, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    out = AlertOut.model_validate(alert)
    if alert.client:
        out.client_nom = f"{alert.client.nom} {alert.client.prenom or ''}".strip()
        out.client_code = alert.client.code_client
    return out


@router.put("/{id}", response_model=AlertOut)
def update_alert(
    id: str,
    alert_in: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    alert = alert_repository.get(db, id)
    if not alert:
        alert = alert_repository.get_by_reference(db, id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerte non trouvée")
    
    updated = alert_repository.update(db, alert, alert_in)
    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else "Analyste",
        role=current_user.role if current_user else "Analyste",
        action="Mise à jour alerte",
        module="Centre d'alertes",
        cible=alert.reference,
        details=f"Statut changé en {alert_in.statut or alert.statut}",
    )
    out = AlertOut.model_validate(updated)
    if updated.client:
        out.client_nom = f"{updated.client.nom} {updated.client.prenom or ''}".strip()
        out.client_code = updated.client.code_client
    return out

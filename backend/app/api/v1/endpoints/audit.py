from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut

router = APIRouter()


@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    response: Response,
    module: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Recherche texte : utilisateur, action, cible, détails"),
    order: str = Query("desc", description="Ordre de tri par horodatage : 'asc' ou 'desc'"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if module:
        query = query.filter(AuditLog.module.ilike(f"%{module}%"))
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            (AuditLog.utilisateur.ilike(pattern))
            | (AuditLog.action.ilike(pattern))
            | (AuditLog.cible.ilike(pattern))
            | (AuditLog.details.ilike(pattern))
        )
    response.headers["X-Total-Count"] = str(query.count())
    order_col = AuditLog.timestamp.asc() if order == "asc" else AuditLog.timestamp.desc()
    return query.order_by(order_col).offset(skip).limit(limit).all()

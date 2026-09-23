from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.investigation import Investigation
from app.repositories.base import BaseRepository


class InvestigationRepository(BaseRepository[Investigation]):
    def __init__(self):
        super().__init__(Investigation)

    def get_by_reference(self, db: Session, reference: str) -> Optional[Investigation]:
        return db.query(Investigation).filter(Investigation.reference == reference).first()

    def get_by_status(
        self, db: Session, status: Optional[str] = None, skip: int = 0, limit: Optional[int] = None
    ) -> List[Investigation]:
        q = db.query(Investigation)
        if status and status != "toutes":
            q = q.filter(Investigation.status == status)
        q = q.order_by(Investigation.date_ouverture.desc()).offset(skip)
        if limit is not None:
            q = q.limit(limit)
        return q.all()

    def count_by_status(self, db: Session, status: Optional[str] = None) -> int:
        q = db.query(Investigation)
        if status and status != "toutes":
            q = q.filter(Investigation.status == status)
        return q.count()

    def close_investigation(
        self, db: Session, investigation: Investigation, status: str, decision: str
    ) -> Investigation:
        investigation.status = status
        investigation.decision = decision
        investigation.date_cloture = datetime.utcnow()
        db.add(investigation)
        db.commit()
        db.refresh(investigation)
        return investigation

    def reopen_investigation(self, db: Session, investigation: Investigation) -> Investigation:
        investigation.status = "en_cours"
        investigation.decision = None
        investigation.date_cloture = None
        db.add(investigation)
        db.commit()
        db.refresh(investigation)
        return investigation


investigation_repository = InvestigationRepository()

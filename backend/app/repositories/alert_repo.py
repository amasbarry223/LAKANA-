from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.repositories.base import BaseRepository


class AlertRepository(BaseRepository[Alert]):
    def __init__(self):
        super().__init__(Alert)

    def get_by_reference(self, db: Session, reference: str) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.reference == reference).first()

    def filter_alerts(
        self,
        db: Session,
        statut: Optional[str] = None,
        niveau: Optional[str] = None,
        module: Optional[str] = None,
        analyste: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Alert]:
        q = db.query(Alert)
        if statut and statut != "Tous statuts":
            q = q.filter(Alert.statut == statut)
        if niveau and niveau != "Tous niveaux":
            q = q.filter(Alert.niveau == niveau.lower())
        if module and module != "Tous modules":
            q = q.filter(Alert.module == module)
        if analyste and analyste != "Tous analystes":
            q = q.filter(Alert.analyste.ilike(f"%{analyste}%"))
        return q.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()

    def count_by_level(self, db: Session) -> dict:
        total = db.query(Alert).count()
        bloquantes = db.query(Alert).filter(Alert.niveau == "bloquante").count()
        analyser = db.query(Alert).filter(Alert.niveau == "analyser").count()
        informatives = db.query(Alert).filter(Alert.niveau == "informative").count()
        return {
            "total": total,
            "bloquante": bloquantes,
            "analyser": analyser,
            "informative": informatives,
        }


alert_repository = AlertRepository()

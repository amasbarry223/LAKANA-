from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.client import Client
from app.repositories.base import BaseRepository


class AlertRepository(BaseRepository[Alert]):
    def __init__(self):
        super().__init__(Alert)

    def get_by_reference(self, db: Session, reference: str) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.reference == reference).first()

    def _apply_filters(
        self,
        db: Session,
        statut: Optional[str] = None,
        niveau: Optional[str] = None,
        module: Optional[str] = None,
        analyste: Optional[str] = None,
        q: Optional[str] = None,
        classification: Optional[str] = None,
    ):
        query = db.query(Alert)
        if statut and statut != "Tous statuts":
            statuts = [s.strip() for s in statut.split(",") if s.strip()]
            query = query.filter(Alert.statut.in_(statuts)) if len(statuts) > 1 else query.filter(
                Alert.statut == statuts[0]
            )
        if niveau and niveau != "Tous niveaux":
            query = query.filter(Alert.niveau == niveau.lower())
        if module and module != "Tous modules":
            query = query.filter(Alert.module == module)
        if analyste and analyste != "Tous analystes":
            query = query.filter(Alert.analyste.ilike(f"%{analyste}%"))
        if q:
            pattern = f"%{q}%"
            query = query.outerjoin(Client, Alert.client_id == Client.id).filter(
                (Alert.reference.ilike(pattern))
                | (Alert.type_alerte.ilike(pattern))
                | (Alert.module.ilike(pattern))
                | (Alert.analyste.ilike(pattern))
                | (Client.nom.ilike(pattern))
                | (Client.prenom.ilike(pattern))
                | (Client.code_client.ilike(pattern))
            )
        if classification == "sanctions_ppe":
            # Même heuristique que l'ancien filtrage cote client (sanctions.tsx) :
            # module, type ou facteurs évoquant une correspondance sanctions/PPE.
            query = query.filter(
                (Alert.module.ilike("%sanction%"))
                | (Alert.type_alerte.ilike("%ppe%"))
                | (Alert.type_alerte.ilike("%sanction%"))
                | (Alert._facteurs.ilike("%sanction%"))
                | (Alert._facteurs.ilike("%ppe%"))
                | (Alert._facteurs.ilike("%liste%"))
            )
        return query

    def filter_alerts(
        self,
        db: Session,
        statut: Optional[str] = None,
        niveau: Optional[str] = None,
        module: Optional[str] = None,
        analyste: Optional[str] = None,
        q: Optional[str] = None,
        classification: Optional[str] = None,
        order: str = "desc",
        skip: int = 0,
        limit: int = 100,
    ) -> List[Alert]:
        query = self._apply_filters(db, statut, niveau, module, analyste, q, classification)
        order_col = Alert.created_at.asc() if order == "asc" else Alert.created_at.desc()
        return query.order_by(order_col).offset(skip).limit(limit).all()

    def count_alerts(
        self,
        db: Session,
        statut: Optional[str] = None,
        niveau: Optional[str] = None,
        module: Optional[str] = None,
        analyste: Optional[str] = None,
        q: Optional[str] = None,
        classification: Optional[str] = None,
    ) -> int:
        return self._apply_filters(db, statut, niveau, module, analyste, q, classification).count()

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

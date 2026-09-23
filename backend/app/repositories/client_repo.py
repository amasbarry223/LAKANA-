from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.client import Client
from app.repositories.base import BaseRepository


class ClientRepository(BaseRepository[Client]):
    def __init__(self):
        super().__init__(Client)

    def get_by_code(self, db: Session, code_client: str) -> Optional[Client]:
        return db.query(Client).filter(Client.code_client == code_client).first()

    def get_with_accounts(self, db: Session, client_id: str) -> Optional[Client]:
        return db.query(Client).options(joinedload(Client.comptes)).filter(Client.id == client_id).first()

    def search_by_name(self, db: Session, query: str, limit: int = 20) -> List[Client]:
        pattern = f"%{query}%"
        return db.query(Client).filter(
            (Client.nom.ilike(pattern)) | (Client.prenom.ilike(pattern)) | (Client.code_client.ilike(pattern))
        ).limit(limit).all()

    def _apply_filters(
        self,
        db: Session,
        q: Optional[str] = None,
        type_client: Optional[str] = None,
        est_ppe: Optional[bool] = None,
        niveau_risque: Optional[str] = None,
    ):
        query = db.query(Client)
        if q:
            pattern = f"%{q}%"
            query = query.filter(
                (Client.nom.ilike(pattern))
                | (Client.prenom.ilike(pattern))
                | (Client.code_client.ilike(pattern))
                | (Client.raison_sociale.ilike(pattern))
                | (Client.rccm.ilike(pattern))
                | (Client.nif.ilike(pattern))
                | (Client.ville.ilike(pattern))
            )
        if type_client:
            query = query.filter(Client.type_client == type_client)
        if est_ppe is not None:
            query = query.filter(Client.est_ppe == est_ppe)
        if niveau_risque:
            query = query.filter(Client.niveau_risque == niveau_risque)
        return query

    def search_and_filter(
        self,
        db: Session,
        q: Optional[str] = None,
        type_client: Optional[str] = None,
        est_ppe: Optional[bool] = None,
        niveau_risque: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Client]:
        query = self._apply_filters(db, q, type_client, est_ppe, niveau_risque)
        return query.order_by(Client.created_at.desc()).offset(skip).limit(limit).all()

    def count_search_and_filter(
        self,
        db: Session,
        q: Optional[str] = None,
        type_client: Optional[str] = None,
        est_ppe: Optional[bool] = None,
        niveau_risque: Optional[str] = None,
    ) -> int:
        return self._apply_filters(db, q, type_client, est_ppe, niveau_risque).count()


client_repository = ClientRepository()

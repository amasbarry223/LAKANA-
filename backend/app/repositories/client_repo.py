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


client_repository = ClientRepository()

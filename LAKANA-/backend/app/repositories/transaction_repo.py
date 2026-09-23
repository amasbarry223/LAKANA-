from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.client import Client
from app.repositories.base import BaseRepository


class TransactionRepository(BaseRepository[Transaction]):
    def __init__(self):
        super().__init__(Transaction)

    def _apply_filters(
        self,
        db: Session,
        q: Optional[str] = None,
        type_operation: Optional[str] = None,
        montant_min: Optional[float] = None,
        montant_max: Optional[float] = None,
    ):
        query = db.query(Transaction)
        if q or type_operation:
            query = query.outerjoin(Client, Transaction.client_id == Client.id)
        if q:
            pattern = f"%{q}%"
            query = query.filter(
                (Transaction.reference.ilike(pattern))
                | (Transaction.beneficiaire_nom.ilike(pattern))
                | (Transaction.description.ilike(pattern))
                | (Client.nom.ilike(pattern))
                | (Client.prenom.ilike(pattern))
                | (Client.raison_sociale.ilike(pattern))
            )
        if type_operation:
            query = query.filter(Transaction.type_operation.ilike(f"%{type_operation}%"))
        if montant_min is not None:
            query = query.filter(Transaction.montant >= montant_min)
        if montant_max is not None:
            query = query.filter(Transaction.montant < montant_max)
        return query

    def filter_transactions(
        self,
        db: Session,
        q: Optional[str] = None,
        type_operation: Optional[str] = None,
        montant_min: Optional[float] = None,
        montant_max: Optional[float] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Transaction]:
        query = self._apply_filters(
            db, q=q, type_operation=type_operation, montant_min=montant_min, montant_max=montant_max
        )
        return query.order_by(Transaction.date_transaction.desc()).offset(skip).limit(limit).all()

    def count_filtered(
        self,
        db: Session,
        q: Optional[str] = None,
        type_operation: Optional[str] = None,
        montant_min: Optional[float] = None,
        montant_max: Optional[float] = None,
    ) -> int:
        return self._apply_filters(
            db, q=q, type_operation=type_operation, montant_min=montant_min, montant_max=montant_max
        ).count()

    def get_by_client(self, db: Session, client_id: str, skip: int = 0, limit: int = 50) -> List[Transaction]:
        return (
            db.query(Transaction)
            .filter(Transaction.client_id == client_id)
            .order_by(Transaction.date_transaction.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_client(self, db: Session, client_id: str) -> int:
        return db.query(Transaction).filter(Transaction.client_id == client_id).count()

    def get_in_window(
        self, db: Session, client_id: str, hours: int = 48, until: Optional[datetime] = None
    ) -> List[Transaction]:
        end_time = until or datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        return (
            db.query(Transaction)
            .filter(
                Transaction.client_id == client_id,
                Transaction.date_transaction >= start_time,
                Transaction.date_transaction <= end_time,
            )
            .order_by(Transaction.date_transaction.asc())
            .all()
        )


transaction_repository = TransactionRepository()

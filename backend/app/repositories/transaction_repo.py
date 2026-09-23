from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.repositories.base import BaseRepository


class TransactionRepository(BaseRepository[Transaction]):
    def __init__(self):
        super().__init__(Transaction)

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

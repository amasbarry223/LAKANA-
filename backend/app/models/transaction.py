import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String, unique=True, index=True, nullable=False)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    compte_source_id = Column(String, nullable=True)
    numero_compte_expediteur = Column(String, index=True, nullable=True)  # Numéro de compte de l'expéditeur
    compte_destination_id = Column(String, nullable=True)
    beneficiaire_nom = Column(String, index=True, nullable=True)
    
    montant = Column(Float, nullable=False)
    devise = Column(String, default="XOF")
    type_operation = Column(String, default="Dépôt")  # Dépôt, Retrait, Virement, Mobile Money
    canal = Column(String, default="Guichet")          # Guichet, Agent, Mobile
    description = Column(String, nullable=True)
    date_transaction = Column(DateTime, default=datetime.utcnow, index=True)

    # Relations
    client = relationship("Client", back_populates="transactions")

    __table_args__ = (
        Index("ix_transactions_client_date", "client_id", "date_transaction"),
    )

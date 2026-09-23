import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    numero_compte = Column(String, unique=True, index=True, nullable=False)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    type_compte = Column(String, default="Courant")  # Courant, Épargne, Tontine, Micro-crédit
    solde = Column(Float, default=0.0)
    devise = Column(String, default="XOF")
    date_ouverture = Column(DateTime, default=datetime.utcnow)

    # Relations
    client = relationship("Client", back_populates="comptes")

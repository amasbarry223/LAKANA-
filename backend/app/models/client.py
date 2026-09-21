import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code_client = Column(String, unique=True, index=True, nullable=False)  # ex: CLI-1042
    nom = Column(String, index=True, nullable=False)
    prenom = Column(String, nullable=True)
    date_naissance = Column(String, nullable=True)
    profession = Column(String, nullable=True)
    ville = Column(String, nullable=True, default="Bamako")
    pays = Column(String, nullable=True, default="Mali")
    telephone = Column(String, nullable=True)
    
    # Indicateurs conformité
    est_ppe = Column(Boolean, default=False)
    niveau_risque = Column(String, default="Faible")  # Élevé, Moyen, Faible
    risk_score = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    comptes = relationship("Account", back_populates="client", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="client", cascade="all, delete-orphan")
    alertes = relationship("Alert", back_populates="client", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="client", cascade="all, delete-orphan")

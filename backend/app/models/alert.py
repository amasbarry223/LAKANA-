import uuid
import json
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String, unique=True, index=True, nullable=False)  # ex: ALR-241
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    
    type_alerte = Column(String, nullable=False)  # Fractionnement, Correspondance PPE, Volume inhabituel...
    niveau = Column(String, default="analyser")    # bloquante, analyser, informative
    score = Column(Integer, default=0)
    module = Column(String, default="Risk Score")  # Fractionnement, Filtrage sanctions, Risk Score, Comportementale
    
    # Stockage JSON des facteurs de risque explicatifs (IA-02 / SCR-02)
    _facteurs = Column("facteurs", Text, default="[]")
    
    statut = Column(String, default="nouvelle")    # nouvelle, en_cours, cloturee, classee
    analyste = Column(String, nullable=True)       # Analyste assigné
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    @property
    def facteurs(self):
        try:
            return json.loads(self._facteurs) if self._facteurs else []
        except Exception:
            return []

    @facteurs.setter
    def facteurs(self, value):
        if isinstance(value, list) or isinstance(value, dict):
            self._facteurs = json.dumps(value, ensure_ascii=False)
        else:
            self._facteurs = str(value)

    # Relations
    client = relationship("Client", back_populates="alertes")
    investigation = relationship("Investigation", back_populates="alerte", uselist=False)

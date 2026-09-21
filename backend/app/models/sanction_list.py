import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.db.base import Base


class SanctionEntry(Base):
    __tablename__ = "sanction_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code_entree = Column(String, index=True, nullable=True)  # ex: FLT-241
    nom_complet = Column(String, index=True, nullable=False)
    aliases = Column(String, nullable=True)                  # variantes orthographiques
    liste_type = Column(String, index=True, nullable=False)  # ONU, GAFI, CENTIF, PPE
    liste_nom = Column(String, nullable=False)               # "Sanctions ONU", "Liste PPE Mali"...
    titre_fonction = Column(String, nullable=True)           # "Conseiller ministériel", "Directeur"...
    nationalite = Column(String, default="Mali")
    date_inscription = Column(DateTime, default=datetime.utcnow)

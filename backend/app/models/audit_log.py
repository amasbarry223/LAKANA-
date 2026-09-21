import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    utilisateur = Column(String, nullable=False)   # ex: "Aminata Touré"
    role = Column(String, nullable=False)
    action = Column(String, nullable=False)        # ex: "Clôture investigation", "Rejet faux positif"
    module = Column(String, nullable=False)        # ex: "Investigations", "Filtrage sanctions"
    cible = Column(String, nullable=True)          # ex: "INV-241", "CLI-1087"
    details = Column(Text, nullable=True)
    ip_address = Column(String, default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

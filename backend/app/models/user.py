import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    nom_complet = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="Analyste conformité")  # Analyste conformité, Responsable conformité, Administrateur système, Auditeur
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    mfa_enabled = Column(Boolean, default=False)
    institution = Column(String, default="SFD Bamako")
    created_at = Column(DateTime, default=datetime.utcnow)

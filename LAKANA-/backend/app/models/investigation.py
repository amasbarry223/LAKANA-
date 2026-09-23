import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference = Column(String, unique=True, index=True, nullable=False)  # ex: INV-241
    alerte_id = Column(String, ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    client_id = Column(String, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    
    analyste = Column(String, nullable=False)      # ex: "A. Touré"
    status = Column(String, default="en_cours")    # en_cours, cloturee, transmise
    type_motif = Column(String, nullable=True)     # Fractionnement, Correspondance PPE...
    
    decision = Column(Text, nullable=True)         # Motif argumenté de clôture ou déclaration CENTIF (INV-02)
    notes_count = Column(Integer, default=1)
    pieces_count = Column(Integer, default=0)
    journal_notes = Column(Text, nullable=True)
    
    date_ouverture = Column(DateTime, default=datetime.utcnow)
    date_cloture = Column(DateTime, nullable=True)

    # Relations
    alerte = relationship("Alert", back_populates="investigation")
    client = relationship("Client", back_populates="investigations")

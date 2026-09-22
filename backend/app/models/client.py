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
    
    # Type de client : "Particulier" ou "Entreprise"
    type_client = Column(String, default="Particulier")

    # Champs spécifiques Entreprise (Personne morale)
    raison_sociale = Column(String, nullable=True)
    forme_juridique = Column(String, nullable=True)  # SARL, SA, SUARL, GIE, etc.
    rccm = Column(String, nullable=True)  # Registre du commerce
    nif = Column(String, nullable=True)   # Numéro fiscal
    secteur_activite = Column(String, nullable=True)
    beneficiaire_effectif = Column(String, nullable=True)  # UBO(s)

    # Champs spécifiques Particulier & PPE (Personne physique)
    piece_identite = Column(String, nullable=True)  # CNI, Passeport, NINA...
    est_ppe = Column(Boolean, default=False)
    fonction_ppe = Column(String, nullable=True)    # Ministre, Député, Magistrat...
    type_ppe = Column(String, nullable=True)        # Nationale, Étrangère, Famille/Associé
    pays_mandat = Column(String, nullable=True)     # Pays d'exercice du mandat politique

    # Informations financières & KYC
    numero_compte = Column(String, index=True, nullable=True)  # Numéro de compte bancaire/SFD principal
    revenu = Column(Float, default=0.0)                         # Revenu mensuel estimé en FCFA
    source_revenu = Column(String, nullable=True)               # Origine des fonds / source de revenu

    # Indicateurs conformité
    niveau_risque = Column(String, default="Faible")  # Élevé, Moyen, Faible
    risk_score = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    comptes = relationship("Account", back_populates="client", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="client", cascade="all, delete-orphan")
    alertes = relationship("Alert", back_populates="client", cascade="all, delete-orphan")
    investigations = relationship("Investigation", back_populates="client", cascade="all, delete-orphan")

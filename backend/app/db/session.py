import os
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

# Détection et configuration du moteur
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True,
    )
    # Test de connectivité
    with engine.connect() as conn:
        pass
    logger.info("Connexion à la base de données réussie.")
except Exception as e:
    # Si PostgreSQL local n'est pas encore démarré, fallback automatique sur SQLite local pour ne pas bloquer les tests
    logger.warning(f"Impossible de joindre la base configurée ({db_url}): {e}. Bascule sur SQLite local.")
    fallback_db_path = os.path.join(os.path.dirname(__file__), "lakana_dev.db")
    db_url = f"sqlite:///{fallback_db_path}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Générateur de session SQLAlchemy pour l'injection de dépendances FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

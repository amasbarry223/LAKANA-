import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.seed import seed_demo_data
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("lakana")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Création des tables
    logger.info("Initialisation de la base de données...")
    Base.metadata.create_all(bind=engine)
    
    # Peuplement des données de démonstration (SFD Mali)
    db = SessionLocal()
    try:
        seed_demo_data(db)
        # Initialisation et entraînement automatique des modèles ML si non présents
        from app.ml.predictor import models_are_ready
        from app.ml.model_trainer import train_models
        if not models_are_ready():
            logger.info("Modèles ML non détectés — Entraînement initial automatique (Isolation Forest & Random Forest)...")
            train_models(db)
            logger.info("Modèles ML entraînés et opérationnels.")
    except Exception as e:
        logger.warning(f"Avertissement initialisation ML : {e}")
    finally:
        db.close()
    
    logger.info("LAKANA API prête.")
    yield
    logger.info("Arrêt de LAKANA API.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montage du routeur v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Santé"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

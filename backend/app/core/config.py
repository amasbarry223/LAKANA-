import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LAKANA API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DESCRIPTION: str = "Plateforme intelligente de conformité et filtrage LBC/FT/FP pour SFD (UEMOA/BCEAO)"

    # Base de données PostgreSQL
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "daouda"
    POSTGRES_DB: str = "lakana_db"
    DATABASE_URL: str = "postgresql://postgres:daouda@localhost:5432/lakana_db"

    # Sécurité JWT
    SECRET_KEY: str = "lakana_super_secret_dev_key_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Règles Métier LBC/FT/FP
    SEUIL_DECLARATION_CENTIF: float = 1_000_000.0  # 1 000 000 FCFA
    FENETRE_FRACTIONNEMENT_HEURES: int = 48
    SEUIL_SIMILARITE_SANCTIONS: float = 80.0

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Assistant IA (Optionnel)
    ANTHROPIC_API_KEY: str = ""

    # Passerelle WhatsApp (WasenderAPI)
    WASENDER_API_KEY: str = ""
    WASENDER_BASE_URL: str = "https://wasenderapi.com/api"
    WASENDER_ALERT_PHONE: str = "+22364663918"

    # Passerelle Email (SMTP)
    ALERT_EMAIL: str = "fombadaouda72@gmail.com"
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "fombadaouda72@gmail.com"
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "fombadaouda72@gmail.com"
    SMTP_TLS: bool = True

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )



settings = Settings()

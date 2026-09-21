from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.client import Client
from app.models.alert import Alert
from app.models.user import User
from app.schemas.transaction import TransactionOut, TransactionCreate
from app.repositories.transaction_repo import transaction_repository
from app.repositories.client_repo import client_repository
from app.services.scoring_service import scoring_service
from app.services.structuring_service import structuring_service
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[TransactionOut])
def list_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return transaction_repository.get_multi(db, skip, limit)


@router.get("/client/{client_id}", response_model=List[TransactionOut])
def list_client_transactions(client_id: str, limit: int = 50, db: Session = Depends(get_db)):
    return transaction_repository.get_by_client(db, client_id, limit)


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    # Vérification que le client existe
    client = client_repository.get(db, tx_in.client_id)
    if not client:
        client = client_repository.get_by_code(db, tx_in.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client associé non trouvé")

    # Enregistrement de la transaction
    tx_in.client_id = client.id
    tx = transaction_repository.create(db, tx_in)

    # Déclenchement temps réel du contrôle de fractionnement et du score
    scoring_result = scoring_service.calculate_score(db, client)
    
    # Si fractionnement ou score critique >= 70, création automatique d'une alerte si pas déjà existante
    if scoring_result["score"] >= 70 or any("Fractionnement" in f for f in scoring_result["facteurs"]):
        alert_ref = f"ALR-{tx.reference[-4:]}"
        existing_alert = db.query(Alert).filter(Alert.client_id == client.id, Alert.statut == "nouvelle").first()
        if not existing_alert:
            new_alert = Alert(
                reference=alert_ref,
                client_id=client.id,
                type_alerte="Fractionnement" if any("Fractionnement" in f for f in scoring_result["facteurs"]) else "Score Élevé",
                niveau="bloquante" if scoring_result["score"] >= 80 else "analyser",
                score=scoring_result["score"],
                module="Fractionnement" if any("Fractionnement" in f for f in scoring_result["facteurs"]) else "Risk Score",
                facteurs=scoring_result["facteurs"],
                statut="nouvelle",
                analyste="A. Touré",
            )
            db.add(new_alert)
            db.commit()

    return tx

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.client import Client
from app.models.account import Account
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
def list_transactions(response: Response, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    response.headers["X-Total-Count"] = str(transaction_repository.count(db))
    return transaction_repository.get_multi(db, skip, limit)


@router.get("/client/{client_id}", response_model=List[TransactionOut])
def list_client_transactions(
    client_id: str, response: Response, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    response.headers["X-Total-Count"] = str(transaction_repository.count_by_client(db, client_id))
    return transaction_repository.get_by_client(db, client_id, skip, limit)


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

    tx_in.client_id = client.id

    # Liaison et mise à jour du compte bancaire
    account = None
    if tx_in.compte_source_id:
        account = db.query(Account).filter(Account.id == tx_in.compte_source_id).first()
        if not account:
            account = db.query(Account).filter(Account.numero_compte == tx_in.compte_source_id).first()

    if not account:
        account = db.query(Account).filter(Account.client_id == client.id).first()

    if account:
        tx_in.compte_source_id = account.id
        if not tx_in.numero_compte_expediteur:
            tx_in.numero_compte_expediteur = account.numero_compte
        if tx_in.type_operation in ["Dépôt", "Virement reçu"]:
            account.solde += tx_in.montant
        elif tx_in.type_operation in ["Retrait", "Virement émis", "Transfert"]:
            account.solde -= tx_in.montant
        db.add(account)

    # Enregistrement de la transaction
    tx = transaction_repository.create(db, tx_in)

    # Déclenchement temps réel du contrôle AML (seuil UEMOA & fractionnement & score)
    scoring_result = scoring_service.calculate_score(db, client)
    
    # 1. Règle Seuil UEMOA : opération >= 5 000 000 FCFA
    is_threshold_breach = tx.montant >= 5000000
    is_structuring = any("Fractionnement" in f for f in scoring_result["facteurs"])
    is_high_risk = scoring_result["score"] >= 70

    if is_threshold_breach or is_structuring or is_high_risk:
        alert_ref = f"ALR-{tx.reference[-4:]}"
        existing_alert = db.query(Alert).filter(Alert.client_id == client.id, Alert.statut == "nouvelle").first()
        if not existing_alert:
            if is_threshold_breach:
                alr_type = "Dépassement de seuil légal UEMOA"
                alr_niv = "bloquante"
                alr_mod = "Seuil Réglementaire (5M FCFA)"
                facteurs = [f"Montant unitaire exceptionnel : {tx.montant:,.0f} FCFA >= 5 000 000 FCFA (Instruction BCEAO)"] + scoring_result["facteurs"]
            elif is_structuring:
                alr_type = "Fractionnement de seuil"
                alr_niv = "bloquante" if scoring_result["score"] >= 80 else "analyser"
                alr_mod = "Fractionnement"
                facteurs = scoring_result["facteurs"]
            else:
                alr_type = "Score de risque critique"
                alr_niv = "bloquante" if scoring_result["score"] >= 80 else "analyser"
                alr_mod = "Risk Score"
                facteurs = scoring_result["facteurs"]

            new_alert = Alert(
                reference=alert_ref,
                client_id=client.id,
                type_alerte=alr_type,
                niveau=alr_niv,
                score=max(scoring_result["score"], 85 if is_threshold_breach else 70),
                module=alr_mod,
                facteurs=facteurs,
                statut="nouvelle",
                analyste="A. Touré",
            )
            db.add(new_alert)

    # Audit log
    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else "Guichet / Système",
        role=current_user.role if current_user else "Agent",
        action="Exécution transaction",
        module="Surveillance Flux",
        cible=tx.reference,
        details=f"Opération {tx.type_operation} de {tx.montant:,.0f} FCFA pour {client.nom} ({client.code_client})",
    )
    db.commit()
    return tx


@router.post("/simuler", response_model=Dict[str, Any], status_code=201)
def simulate_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Point d'entrée riche dédié au simulateur de transactions de l'interface."""
    tx = create_transaction(tx_in, db, current_user)
    
    # Récupérer l'alerte la plus récente si générée pour ce client
    latest_alert = db.query(Alert).filter(Alert.client_id == tx.client_id).order_by(Alert.created_at.desc()).first()
    alert_info = None
    if latest_alert and (latest_alert.reference.endswith(tx.reference[-4:]) or latest_alert.statut == "nouvelle"):
        alert_info = {
            "reference": latest_alert.reference,
            "type_alerte": latest_alert.type_alerte,
            "niveau": latest_alert.niveau,
            "score": latest_alert.score,
            "module": latest_alert.module,
            "facteurs": latest_alert.facteurs,
        }

    account = db.query(Account).filter(Account.id == tx.compte_source_id).first()

    return {
        "transaction": TransactionOut.model_validate(tx),
        "alerte_declenchee": alert_info,
        "nouveau_solde": account.solde if account else None,
        "seuil_uemoa_depasse": tx.montant >= 5000000,
    }

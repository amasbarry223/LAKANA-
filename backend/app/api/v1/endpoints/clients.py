import uuid
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.client import Client
from app.models.account import Account
from app.models.alert import Alert
from app.models.user import User
from app.schemas.client import ClientOut, ClientCreate, ClientUpdate, AccountCreate, AccountOut
from app.repositories.client_repo import client_repository
from app.services.scoring_service import scoring_service
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[ClientOut])
def list_clients(
    response: Response,
    q: Optional[str] = Query(None, description="Recherche par nom, prénom, code client, RCCM, NIF ou ville"),
    type_client: Optional[str] = Query(None, description="Particulier ou Entreprise"),
    est_ppe: Optional[bool] = Query(None),
    niveau_risque: Optional[str] = Query(None, description="Faible, Moyen ou Élevé"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    total = client_repository.count_search_and_filter(
        db, q=q, type_client=type_client, est_ppe=est_ppe, niveau_risque=niveau_risque
    )
    response.headers["X-Total-Count"] = str(total)
    return client_repository.search_and_filter(
        db, q=q, type_client=type_client, est_ppe=est_ppe, niveau_risque=niveau_risque, skip=skip, limit=limit
    )


@router.get("/{id}", response_model=ClientOut)
def get_client(id: str, db: Session = Depends(get_db)):
    client = client_repository.get_with_accounts(db, id)
    if not client:
        # Essai par code client
        client = client_repository.get_by_code(db, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return client


@router.post("", response_model=ClientOut, status_code=201)
def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    existing = client_repository.get_by_code(db, client_in.code_client)
    if existing:
        raise HTTPException(status_code=400, detail="Ce code client existe déjà")
    
    # Règle réglementaire AML : un PPE a un statut de risque élevé d'office (EDD)
    if client_in.est_ppe and client_in.niveau_risque == "Faible":
        client_in.niveau_risque = "Élevé"

    client = client_repository.create(db, client_in)
    
    if client.est_ppe and client.risk_score < 70:
        client.risk_score = 75
        db.add(client)
        db.commit()
        db.refresh(client)
    
    # Audit log personnalisé selon le type de client
    if client.type_client == "Entreprise":
        desc = f"Nouvelle entreprise enrôlée : {client.raison_sociale or client.nom} (RCCM: {client.rccm or 'N/A'}, Forme: {client.forme_juridique or 'N/A'})"
    elif client.est_ppe:
        desc = f"Nouveau client Particulier PPE enrôlé : {client.nom} {client.prenom or ''} (Fonction: {client.fonction_ppe or 'Non spécifiée'})"
    else:
        desc = f"Nouveau client Particulier enrôlé : {client.nom} {client.prenom or ''} ({client.profession or 'Profession non renseignée'})"

    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else "Système",
        role=current_user.role if current_user else "Analyste",
        action="Création client",
        module="Client 360°",
        cible=client.code_client,
        details=desc,
    )
    return client


@router.get("/{id}/score")
def get_client_score(id: str, db: Session = Depends(get_db)):
    client = client_repository.get(db, id)
    if not client:
        client = client_repository.get_by_code(db, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    return scoring_service.calculate_score(db, client)


@router.put("/{id}", response_model=ClientOut)
def update_client(
    id: str,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    client = client_repository.get(db, id)
    if not client:
        client = client_repository.get_by_code(db, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    updated = client_repository.update(db, client, client_in)

    # Règle AML : Si le client est ou devient PPE, vigilance renforcée
    if updated.est_ppe and updated.risk_score < 70:
        updated.risk_score = 75
        updated.niveau_risque = "Élevé"
        db.add(updated)
        db.commit()
        db.refresh(updated)

    # Audit log
    name = updated.raison_sociale or f"{updated.nom} {updated.prenom or ''}".strip()
    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else "Système",
        role=current_user.role if current_user else "Analyste",
        action="Modification client",
        module="Client 360°",
        cible=updated.code_client,
        details=f"Dossier client mis à jour : {name} ({updated.code_client})",
    )
    return updated


@router.delete("/{id}", status_code=204)
def delete_client(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    client = client_repository.get(db, id)
    if not client:
        client = client_repository.get_by_code(db, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    code = client.code_client
    name = client.raison_sociale or f"{client.nom} {client.prenom or ''}".strip()
    client_repository.remove(db, client.id)
    
    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else "Système",
        role=current_user.role if current_user else "Analyste",
        action="Suppression client",
        module="Client 360°",
        cible=code,
        details=f"Client supprimé de la base : {name} ({code})",
    )
    return None


@router.post("/{id}/accounts", status_code=201)
def add_account_to_client(
    id: str,
    account_in: AccountCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Ajout d'un compte bancaire à un client existant avec détection et alerte multi-comptes."""
    client = client_repository.get(db, id)
    if not client:
        client = client_repository.get_by_code(db, id)
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")

    # Vérification unicité numéro de compte
    existing_acc = db.query(Account).filter(Account.numero_compte == account_in.numero_compte).first()
    if existing_acc:
        raise HTTPException(status_code=400, detail=f"Le compte {account_in.numero_compte} existe déjà")

    # Compter les comptes existants
    n_existants = db.query(Account).filter(Account.client_id == client.id).count()
    rang = n_existants + 1

    # Création du compte
    new_account = Account(
        numero_compte=account_in.numero_compte,
        client_id=client.id,
        type_compte=account_in.type_compte,
        solde=account_in.solde,
        devise=account_in.devise or "XOF",
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    alerte_info = None
    # Règle AML demandée : alerte dès que le client crée un nouveau compte (N-ième compte)
    if n_existants >= 1:
        alert_ref = f"ALR-CPT-{new_account.numero_compte[-4:] if len(new_account.numero_compte) >= 4 else uuid.uuid4().hex[:4].upper()}"
        alr_niv = "bloquante" if rang >= 3 else "analyser"
        alr_score = min(85, 45 + (rang * 10))

        new_alert = Alert(
            reference=alert_ref,
            client_id=client.id,
            type_alerte=f"Ouverture de compte multiple ({rang}ème compte)",
            niveau=alr_niv,
            score=alr_score,
            module="Gestion des comptes & KYC",
            facteurs=[
                f"Ouverture du {rang}ème compte bancaire pour ce client ({new_account.numero_compte} - {new_account.type_compte}).",
                "Justification économique requise : vérifier pourquoi le client souhaite ouvrir un compte supplémentaire."
            ],
            statut="nouvelle"
        )
        db.add(new_alert)

        # Majoration de vigilance sur le client
        if client.risk_score < alr_score:
            client.risk_score = alr_score
            client.niveau_risque = "Élevé" if alr_score >= 70 else "Moyen"
            db.add(client)

        db.commit()
        db.refresh(new_alert)
        alerte_info = {
            "reference": new_alert.reference,
            "type_alerte": new_alert.type_alerte,
            "niveau": new_alert.niveau,
            "score": new_alert.score,
            "facteurs": new_alert.facteurs
        }

    # Audit log
    name = client.raison_sociale or f"{client.nom} {client.prenom or ''}".strip()
    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else "Agent de guichet",
        role=current_user.role if current_user else "Agent",
        action="Ouverture de compte bancaire",
        module="Client 360°",
        cible=client.code_client,
        details=f"Création du compte {new_account.numero_compte} ({rang}ème compte pour {name})." + (f" Alerte multi-comptes générée ({rang}ème compte)." if alerte_info else ""),
    )

    return {
        "account": {
            "id": new_account.id,
            "numero_compte": new_account.numero_compte,
            "type_compte": new_account.type_compte,
            "solde": new_account.solde,
            "devise": new_account.devise,
            "client_id": new_account.client_id,
            "date_ouverture": new_account.date_ouverture.isoformat(),
        },
        "alerte_declenchee": alerte_info,
        "rang_compte": rang,
        "message": f"Compte {new_account.numero_compte} créé avec succès ({rang}ème compte pour ce client)."
    }

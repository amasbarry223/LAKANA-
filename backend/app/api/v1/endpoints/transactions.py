from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
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
from app.services.detection_service import detection_service
from app.services.filtering_service import filtering_service
from app.services.notification_service import notification_service
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[TransactionOut])
def list_transactions(
    response: Response,
    q: Optional[str] = Query(None, description="Recherche texte : référence, bénéficiaire, description, client"),
    type_operation: Optional[str] = Query(None),
    montant_min: Optional[float] = Query(None),
    montant_max: Optional[float] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    total = transaction_repository.count_filtered(
        db, q=q, type_operation=type_operation, montant_min=montant_min, montant_max=montant_max
    )
    response.headers["X-Total-Count"] = str(total)
    return transaction_repository.filter_transactions(
        db, q=q, type_operation=type_operation, montant_min=montant_min, montant_max=montant_max, skip=skip, limit=limit
    )


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
    # 1. Vérification que le client existe
    client = client_repository.get(db, tx_in.client_id)
    if not client:
        client = client_repository.get_by_code(db, tx_in.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client associé non trouvé")

    tx_in.client_id = client.id
    nom_complet = f"{client.prenom or ''} {client.nom}".strip()

    # 2. VÉRIFICATION STRICTE DE GEL DES AVOIRS / SANCTIONS (Règle bloquante absolue)
    sanction_matches = filtering_service.match_name(db, nom_cherche=nom_complet, threshold=80.0)
    top_sanction = next((m for m in sanction_matches if m.liste_type in ["ONU", "CENTIF", "GAFI", "GEL"]), None)

    if top_sanction:
        alr_ref = f"ALR-BLQ-{tx_in.reference[-4:] if tx_in.reference else '999'}"
        notification_service.dispatch_aml_alert(
            alerte_ref=alr_ref,
            type_alerte=f"GEL DES AVOIRS — {top_sanction.liste_nom}",
            niveau="bloquante",
            client_nom=nom_complet,
            montant_fcfa=tx_in.montant,
            facteurs=[
                f"Tentative de transaction financière par un individu sous sanction officielle '{top_sanction.liste_nom}' (Réf: {top_sanction.code_entree}).",
                "Instruction légale CENTIF / UEMOA : Blocage immédiat et gel conservatoire des fonds.",
            ],
            agence=client.agence or "Agence Centrale Bamako",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"[GEL DES AVOIRS / SANCTIONS - {top_sanction.liste_nom}] Le sociétaire {nom_complet} fait l'objet d'une mesure de gel des avoirs (Réf: {top_sanction.code_entree}). Toute transaction est strictement interdite. La Direction de la Conformité a été alertée par WhatsApp et Email."
        )

    # 3. Liaison et mise à jour du compte bancaire
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

    # 4. Enregistrement de la transaction
    tx = transaction_repository.create(db, tx_in)

    # 5. CONTRÔLES AML MULTI-RÈGLES EN TEMPS RÉEL
    detected_alerts: List[Dict[str, Any]] = []

    # Règle 1 : Cumul >= 15M FCFA en 24h (OME - Opération de montant élevé)
    ome_alert = detection_service.check_24h_15m_threshold(db, client.id, tx.montant)
    if ome_alert:
        detected_alerts.append(ome_alert)

    # Règle 2 : Montant atypique comparé au revenu déclaré
    atypical_alert = detection_service.check_atypical_amount(client, tx.montant)
    if atypical_alert:
        detected_alerts.append(atypical_alert)

    # Règle 3 : Opération inhabituelle de caissière (horaires ou seuil de caisse)
    cashier_alert = detection_service.check_cashier_anomaly(tx.operateur or "Guichetier 01", tx.montant, tx.date_transaction)
    if cashier_alert:
        detected_alerts.append(cashier_alert)

    # Règle 4 : Mouvements croisés entre plusieurs comptes du même sociétaire
    multi_acc_alert = detection_service.check_multi_account_structuring(db, client.id, tx.numero_compte_beneficiaire, tx.montant)
    if multi_acc_alert:
        detected_alerts.append(multi_acc_alert)

    # Règle 5 : Sociétaire PPE effectuant une transaction importante
    if client.est_ppe and tx.montant >= 2_000_000:
        detected_alerts.append({
            "type": "Opération PPE — Vigilance Renforcée",
            "niveau": "analyser",
            "module": "Filtrage sanctions/PPE",
            "score": 80,
            "facteurs": [
                f"Sociétaire PPE ({client.fonction_ppe or 'Fonction publique'}) effectuant une opération de {tx.montant:,.0f} FCFA.",
                "Obligation réglementaire de visa préalable du Responsable Conformité et justification de l'origine des fonds.",
            ],
        })

    # Règle 6 : Fractionnement ou Seuil UEMOA standard (5M FCFA)
    scoring_result = scoring_service.calculate_score(db, client)
    is_threshold_breach = tx.montant >= 5000000
    is_structuring = any("Fractionnement" in f for f in scoring_result["facteurs"])

    if is_threshold_breach and not ome_alert:
        detected_alerts.append({
            "type": "Dépassement de seuil légal UEMOA",
            "niveau": "bloquante",
            "module": "Seuil Réglementaire (5M FCFA)",
            "score": 85,
            "facteurs": [f"Montant unitaire de {tx.montant:,.0f} FCFA >= 5 000 000 FCFA."] + scoring_result["facteurs"],
        })
    elif is_structuring:
        detected_alerts.append({
            "type": "Fractionnement de dépôts (Smurfing)",
            "niveau": "bloquante" if scoring_result["score"] >= 80 else "analyser",
            "module": "Fractionnement",
            "score": scoring_result["score"],
            "facteurs": scoring_result["facteurs"],
        })

    # Règle 7 : Multi-comptes ou création de nouveau compte sous même CNI/NIF (R-MLT-01)
    multi_identity_res = detection_service.check_multi_accounts_identity(db, client)
    if multi_identity_res["has_multi_accounts"]:
        detected_alerts.append({
            "type": f"Multi-comptes détecté ({multi_identity_res['identifiant_cle']})",
            "niveau": "analyser",
            "module": "Multi-comptes CNI/NIF",
            "score": multi_identity_res["score"],
            "facteurs": multi_identity_res["facteurs"],
        })

    # 6. ENREGISTREMENT ET EXPÉDITION MULTI-CANAL DES ALERTES (WhatsApp & Email)
    if detected_alerts:
        primary_alert = detected_alerts[0]
        alert_ref = f"ALR-{tx.reference[-4:]}"

        existing_alert = db.query(Alert).filter(Alert.client_id == client.id, Alert.reference == alert_ref).first()
        if not existing_alert:
            new_alert = Alert(
                reference=alert_ref,
                client_id=client.id,
                type_alerte=primary_alert["type"],
                niveau=primary_alert["niveau"],
                score=primary_alert["score"],
                module=primary_alert["module"],
                facteurs=primary_alert["facteurs"],
                statut="nouvelle",
                analyste="Aminata Touré",
            )
            db.add(new_alert)

            # DISPATCH AUTOMATIQUE WHATSAPP ET EMAIL
            notification_service.dispatch_aml_alert(
                alerte_ref=alert_ref,
                type_alerte=primary_alert["type"],
                niveau=primary_alert["niveau"],
                client_nom=nom_complet,
                montant_fcfa=tx.montant,
                facteurs=primary_alert["facteurs"],
                agence=client.agence or tx.agence or "Agence Centrale Bamako",
            )

    # Audit log
    audit_service.log_action(
        db,
        utilisateur=current_user.nom_complet if current_user else (tx.operateur or "Guichetier 01"),
        role=current_user.role if current_user else "Agent de guichet",
        action="Exécution transaction",
        module="Surveillance Flux",
        cible=tx.reference,
        details=f"Opération {tx.type_operation} de {tx.montant:,.0f} FCFA pour {nom_complet} ({client.code_client})",
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
    notifications_status = None

    if latest_alert and (latest_alert.reference.endswith(tx.reference[-4:]) or latest_alert.statut == "nouvelle"):
        alert_info = {
            "reference": latest_alert.reference,
            "type_alerte": latest_alert.type_alerte,
            "niveau": latest_alert.niveau,
            "score": latest_alert.score,
            "module": latest_alert.module,
            "facteurs": latest_alert.facteurs,
        }
        notifications_status = {
            "whatsapp_envoye": True,
            "whatsapp_destinataire": "+223 76 12 34 56 (Responsable Conformité)",
            "email_envoye": True,
            "email_destinataire": "conformite@sfd-mali.ml",
        }

    account = db.query(Account).filter(Account.id == tx.compte_source_id).first()

    return {
        "transaction": TransactionOut.model_validate(tx),
        "alerte_declenchee": alert_info,
        "notifications_envoyees": notifications_status,
        "nouveau_solde": account.solde if account else None,
        "seuil_uemoa_depasse": tx.montant >= 5000000,
        "seuil_ome_depasse": tx.montant >= 15000000,
    }

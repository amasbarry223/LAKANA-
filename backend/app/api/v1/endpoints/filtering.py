from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.sanction import MatchResult, SanctionEntryOut
from app.models.sanction_list import SanctionEntry
from app.services.filtering_service import filtering_service

router = APIRouter()


@router.get("/verifier", response_model=List[MatchResult])
def check_name_against_lists(
    nom: str = Query(..., description="Nom complet à vérifier contre les listes sanctions et PPE"),
    seuil: Optional[float] = Query(None, description="Seuil de similarité minimum (ex: 75.0)"),
    db: Session = Depends(get_db),
):
    return filtering_service.match_name(db, nom_cherche=nom, threshold=seuil)


@router.get("/listes", response_model=List[SanctionEntryOut])
def list_sanction_entries(
    type_liste: Optional[str] = Query(None, description="ONU, GAFI, CENTIF ou PPE"),
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(SanctionEntry)
    if type_liste:
        q = q.filter(SanctionEntry.liste_type == type_liste.upper())
    return q.limit(limit).all()


@router.get("/pre-check-guichet/{client_id}")
def pre_check_guichet(client_id: str, db: Session = Depends(get_db)):
    """
    Contrôle préventif instantané pour l'agent de guichet AVANT la transaction.
    Détecte si le sociétaire est une PPE ou fait l'objet d'un gel des avoirs/sanction.
    """
    from app.models.client import Client
    from app.services.notification_service import notification_service
    from app.services.detection_service import detection_service

    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        client = db.query(Client).filter(Client.code_client == client_id).first()
    if not client:
        return {"found": False, "is_ppe": False, "is_sanctioned": False, "has_multi_accounts": False, "message": "Client non répertorié"}

    nom_complet = f"{client.prenom or ''} {client.nom}".strip()
    
    # 1. Vérification contre les sanctions (ONU, CENTIF, etc.)
    matches = filtering_service.match_name(db, nom_cherche=nom_complet, threshold=78.0)
    sanction_matches = [m for m in matches if m.liste_type in ["ONU", "CENTIF", "GAFI", "GEL"]]
    ppe_matches = [m for m in matches if m.liste_type == "PPE"]

    is_sanctioned = len(sanction_matches) > 0
    is_ppe = client.est_ppe or len(ppe_matches) > 0

    # 2. Vérification multi-comptes / dédoublement par CNI ou NIF (R-MLT-01)
    multi_acc = detection_service.check_multi_accounts_identity(db, client)

    if is_sanctioned:
        top_match = sanction_matches[0]
        alr_ref = f"ALR-GEL-{top_match.code_entree or '999'}"
        notification_service.dispatch_aml_alert(
            alerte_ref=alr_ref,
            type_alerte="Gel des avoirs / Sanctions officielles",
            niveau="bloquante",
            client_nom=nom_complet,
            montant_fcfa=0,
            facteurs=[
                f"Présence au guichet d'un sociétaire sous sanction '{top_match.liste_nom}' (Réf: {top_match.code_entree}).",
                "Instruction CENTIF : Interdiction formelle de transaction financière.",
            ],
            agence=client.agence or "Agence Centrale Bamako",
        )

        return {
            "found": True,
            "client_id": client.id,
            "client_nom": nom_complet,
            "code_client": client.code_client,
            "is_ppe": is_ppe,
            "is_sanctioned": True,
            "bloquer_operations": True,
            "niveau": "bloquante",
            "liste_sanction": top_match.liste_nom,
            "reference_sanction": top_match.code_entree,
            "fonction_ppe": client.fonction_ppe,
            "has_multi_accounts": multi_acc["has_multi_accounts"],
            "comptes_count": multi_acc["comptes_count"],
            "comptes": multi_acc["comptes"],
            "identifiant_cle": multi_acc["identifiant_cle"],
            "has_recent_new_account": multi_acc["has_recent_new_account"],
            "message": f"[GEL DES AVOIRS] SOCIETAIRE SOUS SANCTION OFFICIELLE ({top_match.liste_nom} - Ref: {top_match.code_entree}). Gel des avoirs actif : Toute operation est strictement interdite. La Direction de la Conformite a ete alertee par WhatsApp et Email.",
            "consigne_guichet": "Ne pas exécuter l'opération. Prétexter un contrôle technique et aviser discrètement le responsable d'agence.",
        }

    elif is_ppe:
        fonction = client.fonction_ppe or (ppe_matches[0].titre_fonction if ppe_matches else "Personne Politiquement Exposée")
        
        # Si le client PPE a en plus des multi-comptes
        if multi_acc["has_multi_accounts"]:
            alr_ref = f"ALR-MLT-{client.code_client}"
            notification_service.dispatch_aml_alert(
                alerte_ref=alr_ref,
                type_alerte=f"Multi-comptes PPE ({multi_acc['identifiant_cle']})",
                niveau="analyser",
                client_nom=nom_complet,
                montant_fcfa=0,
                facteurs=multi_acc["facteurs"] + [f"Statut PPE : {fonction}"],
                agence=client.agence or "Agence Centrale Bamako",
            )

        consigne = (
            f"Vigilance PPE renforcée + Contrôle multi-comptes : {multi_acc['comptes_count']} comptes rattachés ({multi_acc['identifiant_cle']}). Accord de l'encadrement requis."
            if multi_acc["has_multi_accounts"]
            else "Demander le justificatif de provenance des fonds. S'assurer de la conformité du profil économique."
        )

        return {
            "found": True,
            "client_id": client.id,
            "client_nom": nom_complet,
            "code_client": client.code_client,
            "is_ppe": True,
            "is_sanctioned": False,
            "bloquer_operations": False,
            "niveau": "analyser",
            "fonction_ppe": fonction,
            "type_ppe": client.type_ppe or "Nationale",
            "has_multi_accounts": multi_acc["has_multi_accounts"],
            "comptes_count": multi_acc["comptes_count"],
            "comptes": multi_acc["comptes"],
            "identifiant_cle": multi_acc["identifiant_cle"],
            "has_recent_new_account": multi_acc["has_recent_new_account"],
            "message": f"[VIGILANCE RENFORCEE] SOCIETAIRE PPE (Personne Politiquement Exposee) DETECTE : Titulaire de mandat public ('{fonction}')." + (f" Titulaire de {multi_acc['comptes_count']} comptes ({multi_acc['identifiant_cle']})." if multi_acc["has_multi_accounts"] else ""),
            "consigne_guichet": consigne,
        }

    elif multi_acc["has_multi_accounts"]:
        # Alerte multi-comptes pour client ordinaire
        alr_ref = f"ALR-MLT-{client.code_client}"
        notification_service.dispatch_aml_alert(
            alerte_ref=alr_ref,
            type_alerte=f"Création de nouveau compte / Multi-comptes ({multi_acc['identifiant_cle']})",
            niveau="analyser",
            client_nom=nom_complet,
            montant_fcfa=0,
            facteurs=multi_acc["facteurs"],
            agence=client.agence or "Agence Centrale Bamako",
        )

        return {
            "found": True,
            "client_id": client.id,
            "client_nom": nom_complet,
            "code_client": client.code_client,
            "is_ppe": False,
            "is_sanctioned": False,
            "bloquer_operations": False,
            "niveau": "analyser",
            "has_multi_accounts": True,
            "comptes_count": multi_acc["comptes_count"],
            "comptes": multi_acc["comptes"],
            "identifiant_cle": multi_acc["identifiant_cle"],
            "has_recent_new_account": multi_acc["has_recent_new_account"],
            "message": multi_acc["message"],
            "consigne_guichet": multi_acc["consigne_guichet"],
        }

    return {
        "found": True,
        "client_id": client.id,
        "client_nom": nom_complet,
        "code_client": client.code_client,
        "is_ppe": False,
        "is_sanctioned": False,
        "bloquer_operations": False,
        "niveau": "conforme",
        "has_multi_accounts": False,
        "comptes_count": multi_acc["comptes_count"],
        "comptes": multi_acc["comptes"],
        "identifiant_cle": multi_acc["identifiant_cle"],
        "has_recent_new_account": False,
        "message": "Sociétaire standard — Compte unique, aucun signalement de filtrage négatif.",
        "consigne_guichet": "Traitement guichet standard sous réserve des seuils légaux.",
    }


@router.get("/notifications-dispatched")
def get_dispatched_notifications():
    """Consulte l'historique des alertes transmises par WhatsApp et Email."""
    from app.services.notification_service import notification_service
    return notification_service.get_history()


@router.post("/test-dispatch")
def test_dispatch_notifications(
    phone: Optional[str] = None,
    email: Optional[str] = None
):
    """Déclenche un test d'envoi en direct sur WhatsApp (+223 64663918) et Email (fombadaouda72@gmail.com)."""
    from app.services.notification_service import notification_service
    from datetime import datetime
    ref = f"TEST-LIVE-{int(datetime.utcnow().timestamp())}"
    res = notification_service.dispatch_aml_alert(
        alerte_ref=ref,
        type_alerte="Test fonctionnel des canaux d'alerte",
        niveau="information",
        client_nom="Sociétaire Test Conformité",
        montant_fcfa=15000000.0,
        facteurs=[
            "Test d'intégration WasenderAPI WhatsApp (+223 64663918).",
            "Test d'intégration SMTP Email (fombadaouda72@gmail.com).",
        ],
        agence="Agence Centrale Bamako",
        whatsapp_phone=phone,
        email=email
    )
    return res



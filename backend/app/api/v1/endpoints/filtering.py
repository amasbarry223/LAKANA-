from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
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
    response: Response,
    type_liste: Optional[str] = Query(None, description="ONU, GAFI, CENTIF ou PPE"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(SanctionEntry)
    if type_liste:
        q = q.filter(SanctionEntry.liste_type == type_liste.upper())
    response.headers["X-Total-Count"] = str(q.count())
    return q.offset(skip).limit(limit).all()


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
def get_dispatched_notifications(response: Response, skip: int = 0, limit: int = 50):
    """Consulte l'historique des alertes transmises par WhatsApp et Email."""
    from app.services.notification_service import notification_service
    result = notification_service.get_history(skip=skip, limit=limit)
    response.headers["X-Total-Count"] = str(result["total"])
    return result["data"]


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


# ─────────────────────────────────────────────────────────────────────────────
# GESTION DYNAMIQUE DU RÉFÉRENTIEL PPE (IMPORT CSV, AJOUT, SUPPRESSION)
# ─────────────────────────────────────────────────────────────────────────────
import csv
import io
from pydantic import BaseModel
from app.models.client import Client
from app.models.audit_log import AuditLog
from app.models.alert import Alert


class PPECreate(BaseModel):
    nom_complet: str
    titre_fonction: str
    agence: Optional[str] = "Agence Centrale Bamako"
    numero_compte: Optional[str] = None
    lieu_naissance: Optional[str] = None
    lieu_residence: Optional[str] = None
    nationalite: Optional[str] = "Mali"


class OperationDecisionRequest(BaseModel):
    reference: str
    decision: str  # "autoriser" | "refuser"
    motif: str
    analyste: Optional[str] = "Aminata Touré"
    client_nom: Optional[str] = "Sociétaire PPE"
    montant: Optional[float] = None
    agence: Optional[str] = "Agence Centrale Bamako"


# Mémoire d'arbitrage des opérations en direct
_pending_operations_store: Dict[str, Dict[str, Any]] = {}


@router.get("/ppe")
def get_all_ppe(
    q: Optional[str] = Query(None, description="Recherche par nom ou fonction"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Récupère les personnes politiquement exposées enregistrées dans le référentiel LAKANA."""
    query = db.query(SanctionEntry).filter(SanctionEntry.liste_type == "PPE")
    if q:
        query = query.filter(
            or_(
                SanctionEntry.nom_complet.ilike(f"%{q}%"),
                SanctionEntry.titre_fonction.ilike(f"%{q}%"),
                SanctionEntry.agence.ilike(f"%{q}%"),
                SanctionEntry.numero_compte.ilike(f"%{q}%"),
            )
        )
    total = query.count()
    items = query.order_by(SanctionEntry.date_inscription.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": p.id,
                "code": p.code_entree,
                "nom_complet": p.nom_complet,
                "fonction": p.titre_fonction,
                "agence": p.agence,
                "numero_compte": p.numero_compte,
                "lieu_naissance": p.lieu_naissance,
                "lieu_residence": p.lieu_residence,
                "date_inscription": p.date_inscription.strftime("%d/%m/%Y") if p.date_inscription else "N/A",
                "source": p.liste_nom,
            }
            for p in items
        ],
    }


@router.post("/ppe")
def add_ppe_entry(data: PPECreate, db: Session = Depends(get_db)):
    """Ajoute manuellement une personne au référentiel des PPE LAKANA."""
    import uuid
    from datetime import datetime

    code = f"PPE-{uuid.uuid4().hex[:6].upper()}"
    new_entry = SanctionEntry(
        code_entree=code,
        nom_complet=data.nom_complet.strip(),
        titre_fonction=data.titre_fonction.strip(),
        liste_type="PPE",
        liste_nom="Registre Nominatif PPE SFD",
        agence=data.agence.strip() if data.agence else "Agence Centrale Bamako",
        numero_compte=data.numero_compte.strip() if data.numero_compte else None,
        lieu_naissance=data.lieu_naissance.strip() if data.lieu_naissance else None,
        lieu_residence=data.lieu_residence.strip() if data.lieu_residence else None,
        nationalite=data.nationalite or "Mali",
        date_inscription=datetime.utcnow(),
    )
    db.add(new_entry)

    # Synchroniser le sociétaire existant s'il correspond au nom
    matched_clients = db.query(Client).filter(Client.nom.ilike(f"%{data.nom_complet.split()[-1]}%")).all()
    for c in matched_clients:
        nom_complet_c = f"{c.prenom or ''} {c.nom}".strip().lower()
        if data.nom_complet.strip().lower() in nom_complet_c or nom_complet_c in data.nom_complet.strip().lower():
            c.est_ppe = True
            c.fonction_ppe = data.titre_fonction.strip()
            db.add(c)

    # Piste d'audit
    audit = AuditLog(
        utilisateur="Analyste de conformité",
        role="Analyste de conformité",
        action="Ajout PPE",
        module="Filtrage Sanctions & PPE",
        cible=data.nom_complet.strip(),
        details=f"Inscription de {data.nom_complet} ({data.titre_fonction}) au registre des PPE.",
        timestamp=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": f"PPE '{data.nom_complet}' ajoutée avec succès au référentiel LAKANA.",
        "id": new_entry.id,
        "code": code,
    }


@router.delete("/ppe/{ppe_id}")
def delete_ppe_entry(ppe_id: str, db: Session = Depends(get_db)):
    """Retire une personne du référentiel des PPE LAKANA."""
    from datetime import datetime

    entry = db.query(SanctionEntry).filter(SanctionEntry.id == ppe_id, SanctionEntry.liste_type == "PPE").first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrée PPE non trouvée.")

    nom_retire = entry.nom_complet
    db.delete(entry)

    # Vérifier si le sociétaire a d'autres mentions PPE, sinon le remettre à non-PPE
    matched_clients = db.query(Client).filter(Client.nom.ilike(f"%{nom_retire.split()[-1]}%")).all()
    for c in matched_clients:
        nom_c = f"{c.prenom or ''} {c.nom}".strip().lower()
        if nom_retire.lower() in nom_c or nom_c in nom_retire.lower():
            # Compter si d'autres PPE correspondent
            other_ppe = db.query(SanctionEntry).filter(
                SanctionEntry.id != ppe_id,
                SanctionEntry.liste_type == "PPE",
                SanctionEntry.nom_complet.ilike(f"%{c.nom}%")
            ).count()
            if other_ppe == 0:
                c.est_ppe = False
                c.fonction_ppe = None
                db.add(c)

    # Piste d'audit
    audit = AuditLog(
        utilisateur="Analyste de conformité",
        role="Analyste de conformité",
        action="Suppression PPE",
        module="Filtrage Sanctions & PPE",
        cible=nom_retire,
        details=f"Retrait de {nom_retire} du registre officiel des PPE.",
        timestamp=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": f"PPE '{nom_retire}' retirée du référentiel."}


class ImportCSVPayload(BaseModel):
    csv_content: str
    nom_fichier: Optional[str] = "registre_ppe.csv"


@router.post("/ppe/import-csv")
def import_ppe_csv(payload: ImportCSVPayload, db: Session = Depends(get_db)):
    """
    Importe un fichier CSV de PPE dans la base de données de conformité LAKANA.
    Supporte les délimiteurs virgule, point-virgule ou tabulation et mappe
    automatiquement les colonnes (Nom, Fonction, Agence, N° de Compte, Lieu de naissance/résidence).
    """
    import uuid
    from datetime import datetime

    content = payload.csv_content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Contenu CSV vide.")

    # Détecter le délimiteur
    first_line = content.split("\n")[0]
    delimiter = ";" if ";" in first_line else "," if "," in first_line else "\t"

    reader = csv.reader(io.StringIO(content), delimiter=delimiter)
    rows = list(reader)
    if not rows or len(rows) < 2:
        raise HTTPException(status_code=400, detail="Le fichier CSV doit comporter un en-tête et au moins une ligne.")

    headers = [h.strip().lower() for h in rows[0]]

    # Trouver les indices de colonnes par correspondance floue
    def find_idx(keywords: List[str]) -> int:
        for kw in keywords:
            for idx, h in enumerate(headers):
                if kw in h:
                    return idx
        return -1

    idx_nom = find_idx(["nom", "prenom", "client", "beneficiaire", "personne"])
    idx_fonction = find_idx(["fonction", "titre", "mandat", "poste", "role"])
    idx_agence = find_idx(["agence", "institution", "bureau", "ville"])
    idx_compte = find_idx(["compte", "numero", "n°", "rib"])
    idx_naissance = find_idx(["naissance", "lieu_naissance", "origine"])
    idx_residence = find_idx(["residence", "adresse", "domicile"])

    if idx_nom == -1:
        raise HTTPException(
            status_code=400,
            detail="Colonne du nom introuvable dans le CSV (recherché: Nom, Prénom, Client...)"
        )

    nb_importees = 0
    nb_doublons = 0

    for r in rows[1:]:
        if not r or len(r) <= idx_nom or not r[idx_nom].strip():
            continue

        nom_val = r[idx_nom].strip()
        fonction_val = r[idx_fonction].strip() if idx_fonction != -1 and len(r) > idx_fonction else "Personne Politiquement Exposée"
        agence_val = r[idx_agence].strip() if idx_agence != -1 and len(r) > idx_agence else "Agence Centrale Bamako"
        compte_val = r[idx_compte].strip() if idx_compte != -1 and len(r) > idx_compte else None
        naissance_val = r[idx_naissance].strip() if idx_naissance != -1 and len(r) > idx_naissance else None
        residence_val = r[idx_residence].strip() if idx_residence != -1 and len(r) > idx_residence else None

        # Vérifier doublon strict
        existing = db.query(SanctionEntry).filter(
            SanctionEntry.liste_type == "PPE",
            SanctionEntry.nom_complet.ilike(nom_val)
        ).first()

        if existing:
            # Mise à jour
            existing.titre_fonction = fonction_val
            existing.agence = agence_val
            if compte_val:
                existing.numero_compte = compte_val
            if naissance_val:
                existing.lieu_naissance = naissance_val
            if residence_val:
                existing.lieu_residence = residence_val
            nb_doublons += 1
        else:
            code = f"PPE-{uuid.uuid4().hex[:6].upper()}"
            new_ppe = SanctionEntry(
                code_entree=code,
                nom_complet=nom_val,
                titre_fonction=fonction_val,
                liste_type="PPE",
                liste_nom=payload.nom_fichier or "Import Fichier CSV PPE",
                agence=agence_val,
                numero_compte=compte_val,
                lieu_naissance=naissance_val,
                lieu_residence=residence_val,
                nationalite="Mali",
                date_inscription=datetime.utcnow(),
            )
            db.add(new_ppe)
            nb_importees += 1

        # Synchroniser les clients correspondants
        matched_clients = db.query(Client).filter(Client.nom.ilike(f"%{nom_val.split()[-1]}%")).all()
        for c in matched_clients:
            nom_c = f"{c.prenom or ''} {c.nom}".strip().lower()
            if nom_val.lower() in nom_c or nom_c in nom_val.lower():
                c.est_ppe = True
                c.fonction_ppe = fonction_val
                db.add(c)

    # Traçabilité audit
    audit = AuditLog(
        utilisateur="Analyste de conformité",
        role="Analyste de conformité",
        action="Import CSV Référentiel PPE",
        module="Filtrage Sanctions & PPE",
        cible=payload.nom_fichier or "CSV",
        details=f"Importation terminée : {nb_importees} nouvelles PPE ajoutées, {nb_doublons} existantes actualisées.",
        timestamp=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "total_traitees": len(rows) - 1,
        "nouvelles_importees": nb_importees,
        "existantes_mises_a_jour": nb_doublons,
        "message": f"Importation réussie : {nb_importees} nouvelles PPE intégrées à la base de conformité LAKANA ({nb_doublons} actualisées).",
    }


# ─────────────────────────────────────────────────────────────────────────────
# WORKFLOW TRANSACTIONS : EN ATTENTE & DÉCISION ANALYSTE -> GUICHET
# ─────────────────────────────────────────────────────────────────────────────
class PendingOperationRegister(BaseModel):
    reference: str
    client_id: str
    client_nom: str
    montant: float
    type_operation: str
    motif_alerte: str
    fonction_ppe: Optional[str] = None
    agence: Optional[str] = "Agence Centrale Bamako"
    guichetier: Optional[str] = "Bakary Diarra (Guichet 1)"


@router.post("/operation-pending")
def register_pending_operation(data: PendingOperationRegister, db: Session = Depends(get_db)):
    """
    Enregistre une opération mise en attente au guichet (PPE ou alerte seuil)
    et déclenche la double notification WhatsApp/Email vers le guichet et l'analyste.
    """
    from datetime import datetime
    from app.services.notification_service import notification_service

    ref = data.reference
    _pending_operations_store[ref] = {
        "reference": ref,
        "client_id": data.client_id,
        "client_nom": data.client_nom,
        "montant": data.montant,
        "type_operation": data.type_operation,
        "motif_alerte": data.motif_alerte,
        "fonction_ppe": data.fonction_ppe,
        "agence": data.agence,
        "guichetier": data.guichetier,
        "statut": "en_attente_conformite",
        "date_demande": datetime.utcnow().strftime("%H:%M:%S"),
        "decision": None,
        "motif_decision": None,
        "analyste": None,
    }

    # 1. Notification à l'Agent Guichet (WhatsApp + Email)
    msg_guichet = (
        f"📋 [LAKANA GUICHET - MISE EN ATTENTE]\n"
        f"Sociétaire : {data.client_nom} (PPE : {data.fonction_ppe or 'Oui'})\n"
        f"Opération : {data.type_operation} de {data.montant:,.0f} FCFA\n"
        f"Statut : Mise en attente de l'avis Conformité (Réf: {ref}).\n"
        f"Consigne : Ne pas remettre les fonds sans accord préalable."
    )
    notification_service.dispatch_aml_alert(
        alerte_ref=f"GUICHET-{ref}",
        type_alerte="Opération PPE — En attente validation",
        niveau="analyser",
        client_nom=data.client_nom,
        montant_fcfa=data.montant,
        facteurs=[
            f"Opération guichet {data.type_operation} de {data.montant:,.0f} FCFA initiée.",
            f"Personne Politiquement Exposée : {data.fonction_ppe or 'Mandat public'}.",
            "En attente de la décision de l'Analyste de conformité.",
        ],
        agence=data.agence or "Agence Centrale Bamako",
    )

    # 2. Notification à l'Analyste de Conformité
    msg_analyste = (
        f"🚨 [LAKANA CONFORMITÉ - AVIS REQUIS IMMÉDIAT]\n"
        f"Opération PPE soumise par le Guichet ({data.guichetier})\n"
        f"Sociétaire : {data.client_nom} ({data.fonction_ppe or 'Mandat public'})\n"
        f"Montant : {data.montant:,.0f} FCFA ({data.type_operation})\n"
        f"Réf Dossier : {ref}\n"
        f"Action : Veuillez vous connecter pour valider la dérogation ou refuser l'opération."
    )
    notification_service.dispatch_aml_alert(
        alerte_ref=f"AVIS-{ref}",
        type_alerte="Demande d'autorisation Conformité (PPE)",
        niveau="bloquante",
        client_nom=data.client_nom,
        montant_fcfa=data.montant,
        facteurs=[
            f"Avis formel exigé sous 15 minutes pour libération guichet.",
            f"Origine des fonds à justifier selon Directive BCEAO n°003.",
        ],
        agence=data.agence or "Agence Centrale Bamako",
    )

    return {
        "success": True,
        "reference": ref,
        "statut": "en_attente_conformite",
        "message": "Opération mise en attente. Notifications WhatsApp et Email transmises au guichet et à l'analyste.",
    }


@router.get("/operation-pending")
def list_pending_operations():
    """Liste les opérations actuellement en attente d'arbitrage de la Conformité."""
    return list(_pending_operations_store.values())


@router.post("/operation-decision")
def submit_operation_decision(payload: OperationDecisionRequest, db: Session = Depends(get_db)):
    """
    Retour formel de l'Analyste de conformité vers l'Agent de guichet.
    Autorise ou refuse l'exécution de l'opération mise en attente.
    """
    from datetime import datetime
    from app.services.notification_service import notification_service

    ref = payload.reference
    op = _pending_operations_store.get(ref, {
        "reference": ref,
        "client_nom": payload.client_nom or "Sociétaire PPE",
        "montant": payload.montant or 0,
        "type_operation": "Opération guichet",
    })

    decision_status = "autorisee" if payload.decision.lower() in ["autoriser", "valider", "accorder"] else "refusee"
    op["statut"] = decision_status
    op["decision"] = decision_status
    op["motif_decision"] = payload.motif
    op["analyste"] = payload.analyste or "Aminata Touré (Analyste conformité)"
    op["date_decision"] = datetime.utcnow().strftime("%H:%M:%S")
    _pending_operations_store[ref] = op

    # Notification WhatsApp & Email au Guichet
    if decision_status == "autorisee":
        notification_service.dispatch_aml_alert(
            alerte_ref=f"DECISION-{ref}",
            type_alerte="Opération AUTORISÉE par la Conformité",
            niveau="information",
            client_nom=op.get("client_nom", "Sociétaire"),
            montant_fcfa=op.get("montant", 0),
            facteurs=[
                f"Visa accordé par {op['analyste']}.",
                f"Motif : {payload.motif}",
                "Consigne guichet : Vous pouvez exécuter l'opération et remettre les fonds.",
            ],
            agence=payload.agence or "Agence Centrale Bamako",
        )
    else:
        notification_service.dispatch_aml_alert(
            alerte_ref=f"DECISION-{ref}",
            type_alerte="Opération REFUSÉE / BLOQUÉE par la Conformité",
            niveau="bloquante",
            client_nom=op.get("client_nom", "Sociétaire"),
            montant_fcfa=op.get("montant", 0),
            facteurs=[
                f"Refus formel notifié par {op['analyste']}.",
                f"Motif : {payload.motif}",
                "Consigne guichet : Ne pas exécuter l'opération. Refuser la remise de fonds.",
            ],
            agence=payload.agence or "Agence Centrale Bamako",
        )

    # Piste d'audit SHA-256
    audit = AuditLog(
        utilisateur=payload.analyste or "Aminata Touré",
        role="Analyste de conformité",
        action=f"Décision opération ({decision_status.upper()})",
        module="Contrôle d'opération / Guichet",
        cible=ref,
        details=f"Décision : {decision_status.upper()} pour {op.get('client_nom')} (Montant : {op.get('montant')} FCFA). Motif : {payload.motif}",
        timestamp=datetime.utcnow(),
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "reference": ref,
        "statut": decision_status,
        "analyste": op["analyste"],
        "motif": payload.motif,
        "message": (
            f"Accord de conformité transmis au guichet. Remise des fonds autorisée."
            if decision_status == "autorisee"
            else f"Refus de conformité transmis au guichet. Opération bloquée."
        ),
    }

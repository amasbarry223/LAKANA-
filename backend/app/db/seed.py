import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.client import Client
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.alert import Alert
from app.models.investigation import Investigation
from app.models.sanction_list import SanctionEntry
from app.models.audit_log import AuditLog

logger = logging.getLogger("lakana.seed")


def seed_demo_data(db: Session):
    """Initialise la base avec des données réelles et représentatives de la microfinance au Mali."""
    # 1. Vérification si les données existent déjà
    if db.query(User).first():
        logger.info("Données déjà présentes dans la base. Étape de seed ignorée.")
        return

    logger.info("Peuplement initial de la base de données LAKANA...")

    # 2. Utilisateurs & Rôles (RBAC)
    users = [
        User(
            nom_complet="Aminata Touré",
            email="aminata.toure@sfd-bamako.ml",
            role="Analyste conformité",
            hashed_password=get_password_hash("password123"),
            institution="SFD Bamako",
            mfa_enabled=False,
        ),
        User(
            nom_complet="Fatoumata Koné",
            email="fatoumata.kone@sfd-bamako.ml",
            role="Responsable conformité",
            hashed_password=get_password_hash("password123"),
            institution="SFD Bamako",
            mfa_enabled=True,
        ),
        User(
            nom_complet="Seydou Traoré",
            email="seydou.traore@sfd-bamako.ml",
            role="Administrateur système",
            hashed_password=get_password_hash("password123"),
            institution="Direction Générale",
            mfa_enabled=True,
        ),
        User(
            nom_complet="Mariam Coulibaly",
            email="mariam.coulibaly@audit-wa.ml",
            role="Auditeur (lecture seule)",
            hashed_password=get_password_hash("password123"),
            institution="Cabinet Audit Externe",
            mfa_enabled=True,
        ),
    ]
    db.add_all(users)
    db.commit()

    # 3. Référentiel Sanctions & PPE (Mali / ONU / GAFI / CENTIF)
    sanction_entries = [
        SanctionEntry(
            code_entree="FLT-241",
            nom_complet="Diarra Fatoumata",
            aliases="Diarra F.;Fatoumata Diarra",
            liste_type="PPE",
            liste_nom="Liste PPE Mali",
            titre_fonction="Conseillère ministérielle",
            nationalite="Mali",
        ),
        SanctionEntry(
            code_entree="FLT-240",
            nom_complet="Moussa Traoré",
            aliases="Traore Moussa;M. Traore",
            liste_type="ONU",
            liste_nom="Sanctions ONU",
            titre_fonction="Opérateur économique sous embargo",
            nationalite="Mali",
        ),
        SanctionEntry(
            code_entree="FLT-239",
            nom_complet="Oumar Sangaré",
            aliases="Oumar Sangare;Sangare O.",
            liste_type="GAFI",
            liste_nom="Sanctions GAFI",
            titre_fonction="Personne désignée blanchiment",
            nationalite="Mali",
        ),
        SanctionEntry(
            code_entree="FLT-235",
            nom_complet="Boubacar Coulibaly",
            aliases="B. Coulibary;Boubacar Coulibali",
            liste_type="CENTIF",
            liste_nom="CENTIF-Mali",
            titre_fonction="Signalement blanchiment capitaux",
            nationalite="Mali",
        ),
    ]
    db.add_all(sanction_entries)
    db.commit()

    # 4. Clients
    cli_moussa = Client(
        code_client="CLI-1042",
        nom="Traoré",
        prenom="Moussa",
        date_naissance="14/05/1984",
        profession="Commerçant import-export",
        ville="Bamako",
        est_ppe=False,
        niveau_risque="Élevé",
        risk_score=87,
    )
    cli_fatoumata = Client(
        code_client="CLI-1087",
        nom="Diarra",
        prenom="Fatoumata",
        date_naissance="22/11/1979",
        profession="Cadre d'administration",
        ville="Bamako",
        est_ppe=True,
        niveau_risque="Élevé",
        risk_score=72,
    )
    cli_ibrahim = Client(
        code_client="CLI-1103",
        nom="Keïta",
        prenom="Ibrahim",
        date_naissance="03/02/1990",
        profession="Agriculteur - Maraîchage",
        ville="Sikasso",
        est_ppe=False,
        niveau_risque="Moyen",
        risk_score=64,
    )
    cli_aissata = Client(
        code_client="CLI-1066",
        nom="Coulibaly",
        prenom="Aïssata",
        date_naissance="18/09/1988",
        profession="Gestionnaire boutique",
        ville="Ségou",
        est_ppe=False,
        niveau_risque="Moyen",
        risk_score=58,
    )
    cli_seydou = Client(
        code_client="CLI-1055",
        nom="Touré",
        prenom="Seydou",
        date_naissance="07/07/1975",
        profession="Entrepreneur BTP",
        ville="Kayes",
        est_ppe=False,
        niveau_risque="Moyen",
        risk_score=41,
    )
    db.add_all([cli_moussa, cli_fatoumata, cli_ibrahim, cli_aissata, cli_seydou])
    db.commit()

    # 5. Comptes bancaires SFD
    cpt1_moussa = Account(numero_compte="4821-001", client_id=cli_moussa.id, type_compte="Courant", solde=3_450_000.0)
    cpt2_moussa = Account(numero_compte="7390-002", client_id=cli_moussa.id, type_compte="Épargne", solde=8_200_000.0)
    cpt_fatou = Account(numero_compte="5192-001", client_id=cli_fatoumata.id, type_compte="Courant", solde=1_950_000.0)
    cpt_ibrahim = Account(numero_compte="6401-001", client_id=cli_ibrahim.id, type_compte="Courant", solde=780_000.0)
    db.add_all([cpt1_moussa, cpt2_moussa, cpt_fatou, cpt_ibrahim])
    db.commit()

    # 6. Transactions (Cas réel de fractionnement sous le seuil de 1M FCFA)
    now = datetime.utcnow()
    moussa_txs = [
        Transaction(reference="TX-901", client_id=cli_moussa.id, compte_source_id=cpt1_moussa.id, beneficiaire_nom="Diallo F.", montant=920_000.0, date_transaction=now - timedelta(hours=36), type_operation="Dépôt espèces"),
        Transaction(reference="TX-902", client_id=cli_moussa.id, compte_source_id=cpt1_moussa.id, beneficiaire_nom="Sow A.", montant=880_000.0, date_transaction=now - timedelta(hours=30), type_operation="Dépôt espèces"),
        Transaction(reference="TX-903", client_id=cli_moussa.id, compte_source_id=cpt1_moussa.id, beneficiaire_nom="Diallo F.", montant=950_000.0, date_transaction=now - timedelta(hours=24), type_operation="Dépôt espèces"),
        Transaction(reference="TX-904", client_id=cli_moussa.id, compte_source_id=cpt1_moussa.id, beneficiaire_nom="Camara K.", montant=760_000.0, date_transaction=now - timedelta(hours=18), type_operation="Virement"),
        Transaction(reference="TX-905", client_id=cli_moussa.id, compte_source_id=cpt2_moussa.id, beneficiaire_nom="Camara K.", montant=690_000.0, date_transaction=now - timedelta(hours=12), type_operation="Dépôt"),
        Transaction(reference="TX-906", client_id=cli_moussa.id, compte_source_id=cpt2_moussa.id, beneficiaire_nom="Bah M.", montant=600_000.0, date_transaction=now - timedelta(hours=4), type_operation="Retrait"),
    ]
    fatou_txs = [
        Transaction(reference="TX-801", client_id=cli_fatoumata.id, compte_source_id=cpt_fatou.id, beneficiaire_nom="Trésor Public", montant=950_000.0, date_transaction=now - timedelta(hours=20), type_operation="Virement"),
        Transaction(reference="TX-802", client_id=cli_fatoumata.id, compte_source_id=cpt_fatou.id, beneficiaire_nom="Partenaire Commerce", montant=880_000.0, date_transaction=now - timedelta(hours=10), type_operation="Virement"),
    ]
    db.add_all(moussa_txs + fatou_txs)
    db.commit()

    # 7. Alertes LBC/FT/FP
    alr1 = Alert(
        reference="ALR-241",
        client_id=cli_moussa.id,
        type_alerte="Fractionnement",
        niveau="bloquante",
        score=87,
        module="Fractionnement",
        facteurs=[
            "Fractionnement détecté : 6 transactions cumulant 4 800 000 FCFA sous le seuil sur 48h (+30 pts)",
            "Volume moyen récent 3.4x supérieur à l'historique (+25 pts)",
            "Fréquence de transactions 2.6x supérieure au profil habituel (+20 pts)",
            "Flux financiers liés à un bénéficiaire préalablement signalé (+10 pts)",
        ],
        statut="en_cours",
        analyste="A. Touré",
    )
    alr2 = Alert(
        reference="ALR-238",
        client_id=cli_fatoumata.id,
        type_alerte="Correspondance PPE",
        niveau="bloquante",
        score=72,
        module="Filtrage sanctions",
        facteurs=[
            "Client enregistré comme Personne Politiquement Exposée (PPE) (+15 pts)",
            "Similarité 96.0% avec Liste PPE Mali (Conseillère ministérielle)",
            "Volume de transactions récent élevé (+20 pts)",
        ],
        statut="en_cours",
        analyste="A. Touré",
    )
    alr3 = Alert(
        reference="ALR-235",
        client_id=cli_ibrahim.id,
        type_alerte="Volume inhabituel",
        niveau="analyser",
        score=64,
        module="Risk Score",
        facteurs=[
            "Volume de transaction moyen récent 2.8x supérieur à l'historique (+15 pts)",
            "Fréquence accélérée sur 7 jours (+12 pts)",
        ],
        statut="en_cours",
        analyste="M. Diallo",
    )
    db.add_all([alr1, alr2, alr3])
    db.commit()

    # 8. Investigations
    inv1 = Investigation(
        reference="INV-241",
        alerte_id=alr1.id,
        client_id=cli_moussa.id,
        analyste="A. Touré",
        status="en_cours",
        type_motif="Fractionnement",
        notes_count=4,
        pieces_count=2,
        decision=None,
    )
    inv2 = Investigation(
        reference="INV-238",
        alerte_id=alr2.id,
        client_id=cli_fatoumata.id,
        analyste="A. Touré",
        status="en_cours",
        type_motif="Correspondance PPE",
        notes_count=2,
        pieces_count=1,
        decision=None,
    )
    inv3 = Investigation(
        reference="INV-219",
        alerte_id=None,
        client_id=cli_seydou.id,
        analyste="M. Diallo",
        status="transmise",
        type_motif="Relations inhabituelles",
        notes_count=7,
        pieces_count=5,
        decision="Déclaration de soupçon transmise au CENTIF après examen approfondi des flux transfrontaliers.",
        date_cloture=now - timedelta(days=2),
    )
    db.add_all([inv1, inv2, inv3])
    db.commit()

    # 9. Piste d'audit initiale
    audit_logs = [
        AuditLog(
            utilisateur="Seydou Traoré",
            role="Administrateur système",
            action="Mise à jour listes sanctions",
            module="Filtrage sanctions",
            cible="ONU / CENTIF",
            details="Import des listes officielles consolidées UMOA/BCEAO 2026",
            timestamp=now - timedelta(days=1),
        ),
        AuditLog(
            utilisateur="Aminata Touré",
            role="Analyste conformité",
            action="Ouverture investigation",
            module="Investigations",
            cible="INV-241",
            details="Prise en charge de l'alerte ALR-241 pour suspicion de fractionnement",
            timestamp=now - timedelta(hours=6),
        ),
    ]
    db.add_all(audit_logs)
    db.commit()

    logger.info("Base de données LAKANA initialisée avec succès avec les données de démonstration.")

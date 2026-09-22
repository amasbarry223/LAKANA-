"""
LAKANA — Génération Massive de 200+ Clients et 90+ Transactions par Client
Respecte strictement les contraintes :
- Au moins 200 nouveaux clients (avec comptes bancaires dédiés)
- Au moins 90 transactions par client réparties sur 90 jours
- Numéro de compte de l'expéditeur explicitement renseigné pour chaque transaction
- Réentraînement complet des modèles ML (Isolation Forest + Random Forest)
"""

import os
import sys
import uuid
import random
from datetime import datetime, timedelta

# Ajouter le répertoire backend au sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, inspect
from app.db.session import SessionLocal, engine
from app.models.client import Client
from app.models.account import Account
from app.models.transaction import Transaction
from app.services.scoring_service import scoring_service
from app.ml.model_trainer import train_models

# ── Listes de données réalistes Ouest-Africaines (Mali / UEMOA) ───────────────

PRENOMS_HOMMES = [
    "Moussa", "Amadou", "Boubacar", "Ibrahima", "Seydou", "Abdoulaye", "Oumar",
    "Cheick", "Modibo", "Youssouf", "Salif", "Drissa", "Bakary", "Mahamadou",
    "Adama", "Souleymane", "Lassana", "Mamadou", "Sekou", "Aliou", "Tidiane",
    "Daouda", "Karim", "Issa", "Moriba", "Bréhima", "Hamidou", "Lamine"
]

PRENOMS_FEMMES = [
    "Fatoumata", "Aminata", "Mariam", "Kadiatou", "Aïssatou", "Mariama",
    "Adjaratou", "Fanta", "Hawa", "Rokia", "Oumou", "Nana", "Bintou",
    "Djeneba", "Safiétou", "Awa", "Assetou", "Coumba", "Salimata", "Sitan",
    "Korotoumou", "Maimouna", "Fatim", "Rokiatou", "Tenin", "Assan"
]

NOMS_FAMILLE = [
    "Traoré", "Coulibaly", "Diarra", "Keïta", "Diallo", "Cissé", "Touré",
    "Koné", "Sangaré", "Bagayoko", "Camara", "Soumaré", "Bah", "Barry",
    "Sow", "Dembélé", "Sidibé", "Samaké", "Ouattara", "Sanogo", "Haïdara",
    "Fofana", "Diakité", "Doumbia", "Sissoko", "Maïga", "Diabaté", "Kouyaté",
    "Ballo", "Guindo", "Togola", "Dabo", "Niakaté", "Tandina", "Koïta", "Kante"
]

VILLES_MALI = [
    "Bamako", "Sikasso", "Ségou", "Mopti", "Kayes", "Koutiala",
    "Koulikoro", "Gao", "San", "Kati", "Bougouni", "Kita"
]

PROFESSIONS_PARTICULIERS = [
    "Commerçant détaillant", "Agriculteur maraîcher", "Enseignant", "Fonctionnaire d'État",
    "Transporteur routier", "Artisan menuisier", "Chauffeur", "Infirmier", "Éleveur",
    "Pharmacien", "Mécanicien", "Agent immobilier", "Comptable", "Cadre télécom",
    "Couturier", "Boucher", "Gérant de boutique", "Restaurateur", "Opérateur minier artisanal"
]

RAISONS_SOCIALES = [
    "Mali Agro Trading", "Sahel Transit & Logistique", "Ségou Céréales SARL",
    "Comptoir Mandingue d'Import-Export", "Koutiala Coton & Fils", "Bani Distribution",
    "Djoliba BTP & Matériaux", "Mopti Pêche & Négoce", "Gao Transport Express",
    "Sikasso Fruits & Légumes GIE", "Bamako Quincaillerie Générale", "Kayes Mines Négoce",
    "Farafina Énergie & Solaire", "Wuro Négoce Bétail", "Soba Matériaux SARL"
]

FONCTIONS_PPE = [
    ("Député à l'Assemblée Nationale", "Nationale"),
    ("Ministre du Gouvernement", "Nationale"),
    ("Directeur Général d'Établissement Public", "Nationale"),
    ("Magistrat à la Cour Suprême", "Nationale"),
    ("Conseiller ministériel", "Nationale"),
    ("Maire de Commune Urbaine", "Nationale"),
    ("Haut Fonctionnaire Douanier", "Nationale"),
    ("Ambassadeur plénipotentiaire", "Étrangère"),
]

TYPES_OPERATION = ["Dépôt espèces", "Retrait espèces", "Virement bancaire", "Mobile Money", "Paiement fournisseur"]
CANAUX = ["Guichet agence", "Agent mobile", "Application mobile", "Guichet agence", "Distributeur automatique"]


def generate_phone() -> str:
    prefixes = ["70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "65", "66", "68", "69"]
    return f"+223 {random.choice(prefixes)} {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)}"


def generate_account_number(idx: int, bank_code: str = "ML01") -> str:
    """Numéro de compte formaté SFD/UEMOA : ML01-2026-XXXXX-K"""
    return f"{bank_code}-2026-{idx:06d}-{(idx * 7) % 97:02d}"


def ensure_database_schema(db):
    """Vérifie et applique l'ajout de la colonne numero_compte_expediteur si nécessaire."""
    inspector = inspect(engine)
    columns = [c["name"] for c in inspector.get_columns("transactions")]
    if "numero_compte_expediteur" not in columns:
        print("[MIGRATION] Ajout de la colonne 'numero_compte_expediteur' à la table transactions...")
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE transactions ADD COLUMN numero_compte_expediteur VARCHAR(100);"))
            conn.commit()
        print("[MIGRATION] Colonne ajoutée avec succès.")


def fix_existing_transactions(db):
    """Renseigne le numero_compte_expediteur sur les transactions existantes qui ne l'ont pas."""
    clients = db.query(Client).all()
    updated = 0
    for client in clients:
        # Récupérer ou créer un compte pour le client
        account = db.query(Account).filter(Account.client_id == client.id).first()
        if not account:
            account = Account(
                id=str(uuid.uuid4()),
                numero_compte=generate_account_number(random.randint(1000, 9999)),
                client_id=client.id,
                type_compte="Courant",
                solde=round(random.uniform(250_000, 3_500_000), 0),
                devise="XOF",
                date_ouverture=datetime.utcnow() - timedelta(days=random.randint(100, 400)),
            )
            db.add(account)
            db.commit()

        # Mettre à jour les transactions orphelines de compte
        txs = db.query(Transaction).filter(
            Transaction.client_id == client.id,
            (Transaction.numero_compte_expediteur == None) | (Transaction.compte_source_id == None)
        ).all()

        for tx in txs:
            tx.compte_source_id = account.id
            tx.numero_compte_expediteur = account.numero_compte
            updated += 1

    if updated > 0:
        db.commit()
        print(f"[MAJ] {updated} transactions existantes enrichies avec leur numéro de compte expéditeur.")


def create_client_profile(idx: int) -> dict:
    """Génère un profil client cohérent (Particulier ou Entreprise)."""
    is_enterprise = random.random() < 0.15
    is_female = random.random() < 0.45
    nom = random.choice(NOMS_FAMILLE)
    prenom = random.choice(PRENOMS_FEMMES if is_female else PRENOMS_HOMMES)
    ville = random.choice(VILLES_MALI)

    # Détermination du profil de risque cible (70% Faible, 20% Moyen, 10% Élevé)
    rand_risk = random.random()
    if rand_risk < 0.70:
        risk_profile = "Faible"
        is_ppe = False
        fonction_ppe = None
        type_ppe = None
    elif rand_risk < 0.90:
        risk_profile = "Moyen"
        is_ppe = random.random() < 0.15
        if is_ppe:
            f_ppe, t_ppe = random.choice(FONCTIONS_PPE)
            fonction_ppe, type_ppe = f_ppe, t_ppe
        else:
            fonction_ppe, type_ppe = None, None
    else:
        risk_profile = "Élevé"
        is_ppe = random.random() < 0.40
        if is_ppe:
            f_ppe, t_ppe = random.choice(FONCTIONS_PPE)
            fonction_ppe, type_ppe = f_ppe, t_ppe
        else:
            fonction_ppe, type_ppe = None, None

    code_client = f"CLI-{2000 + idx:04d}"
    client_id = str(uuid.uuid4())

    client_data = {
        "id": client_id,
        "code_client": code_client,
        "nom": nom,
        "prenom": prenom if not is_enterprise else None,
        "date_naissance": f"{random.randint(1965, 2002)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
        "profession": random.choice(PROFESSIONS_PARTICULIERS) if not is_enterprise else "Société Commerciale",
        "ville": ville,
        "pays": "Mali",
        "telephone": generate_phone(),
        "type_client": "Entreprise" if is_enterprise else "Particulier",
        "raison_sociale": f"{random.choice(RAISONS_SOCIALES)} ({nom})" if is_enterprise else None,
        "forme_juridique": random.choice(["SARL", "GIE", "SUARL"]) if is_enterprise else None,
        "rccm": f"MA.BKO.{random.randint(2015, 2025)}.B.{random.randint(1000, 9999)}" if is_enterprise else None,
        "nif": f"08{random.randint(10000000, 99999999)}A" if is_enterprise else None,
        "secteur_activite": random.choice(["Commerce général", "BTP", "Transport", "Agro-alimentaire", "Services"]) if is_enterprise else None,
        "beneficiaire_effectif": f"{nom} {prenom}" if is_enterprise else None,
        "piece_identite": f"NINA {random.randint(10000000000000, 99999999999999)}" if not is_enterprise else None,
        "est_ppe": is_ppe,
        "fonction_ppe": fonction_ppe,
        "type_ppe": type_ppe,
        "pays_mandat": "Mali" if is_ppe else None,
        "niveau_risque": risk_profile,
        "risk_score": 75 if risk_profile == "Élevé" else 45 if risk_profile == "Moyen" else 15,
        "created_at": datetime.utcnow() - timedelta(days=random.randint(95, 365)),
    }

    return client_data, risk_profile


def generate_transactions_for_client(
    client_id: str,
    account: Account,
    risk_profile: str,
    nb_tx: int = 92
) -> list:
    """Génère au moins 90 transactions pour un client donné sur une fenêtre de 90 jours."""
    now = datetime.utcnow()
    transactions = []

    # Bénéficiaires habituels
    habitual_beneficiaries = [
        f"{random.choice(NOMS_FAMILLE)}, {random.choice(PRENOMS_HOMMES + PRENOMS_FEMMES)}"
        for _ in range(random.randint(1, 4))
    ]

    if risk_profile == "Faible":
        # Profil Normal : montants modestes (40k - 380k FCFA), rythme régulier
        base_amount = random.uniform(60_000, 300_000)
        for i in range(nb_tx):
            # Répartir sur 90 jours
            minutes_ago = random.randint(30, 90 * 24 * 60)
            date_tx = now - timedelta(minutes=minutes_ago)
            montant = round(base_amount * random.uniform(0.6, 1.4), 0)
            benef = random.choice(habitual_beneficiaries) if random.random() < 0.75 else f"{random.choice(NOMS_FAMILLE)}, {random.choice(PRENOMS_HOMMES)}"

            transactions.append(Transaction(
                id=str(uuid.uuid4()),
                reference=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                client_id=client_id,
                compte_source_id=account.id,
                numero_compte_expediteur=account.numero_compte,
                compte_destination_id=None,
                beneficiaire_nom=benef,
                montant=montant,
                devise="XOF",
                type_operation=random.choice(TYPES_OPERATION),
                canal=random.choice(CANAUX),
                description="Opération courante sociétaire",
                date_transaction=date_tx,
            ))

    elif risk_profile == "Moyen":
        # Profil Moyen : montants plus élevés (250k - 850k FCFA), pic d'activité récent
        base_amount = random.uniform(200_000, 500_000)
        for i in range(nb_tx):
            # 20% des transactions sur les 7 derniers jours (pic)
            if i < int(nb_tx * 0.22):
                date_tx = now - timedelta(hours=random.randint(2, 7 * 24))
                montant = round(base_amount * random.uniform(1.4, 2.4), 0)
            else:
                date_tx = now - timedelta(days=random.randint(8, 90), hours=random.randint(1, 23))
                montant = round(base_amount * random.uniform(0.7, 1.3), 0)

            benef = random.choice(habitual_beneficiaries) if random.random() < 0.50 else f"{random.choice(NOMS_FAMILLE)}, {random.choice(PRENOMS_HOMMES)}"
            transactions.append(Transaction(
                id=str(uuid.uuid4()),
                reference=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                client_id=client_id,
                compte_source_id=account.id,
                numero_compte_expediteur=account.numero_compte,
                compte_destination_id=None,
                beneficiaire_nom=benef,
                montant=montant,
                devise="XOF",
                type_operation=random.choice(TYPES_OPERATION),
                canal=random.choice(CANAUX),
                description="Règlement commercial & approvisionnement",
                date_transaction=date_tx,
            ))

    else:
        # Profil Élevé / Suspect :
        # - Fractionnement massif (5 à 9 transactions entre 550k et 990k FCFA dans une fenêtre de 48h)
        # - Volume x4 par rapport à l'historique
        # - Nombreux bénéficiaires inconnus
        base_amount = random.uniform(150_000, 350_000)

        # 1. 10 transactions de fractionnement sous le seuil de 1M en 48h
        base_frac_time = now - timedelta(hours=random.randint(4, 36))
        for j in range(8):
            tx_time = base_frac_time - timedelta(hours=j * random.uniform(1.5, 4.0))
            montant_frac = round(random.uniform(550_000, 990_000), 0)
            benef_frac = f"{random.choice(NOMS_FAMILLE)}, {random.choice(PRENOMS_HOMMES)}"

            transactions.append(Transaction(
                id=str(uuid.uuid4()),
                reference=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                client_id=client_id,
                compte_source_id=account.id,
                numero_compte_expediteur=account.numero_compte,
                compte_destination_id=None,
                beneficiaire_nom=benef_frac,
                montant=montant_frac,
                devise="XOF",
                type_operation="Dépôt espèces" if j % 2 == 0 else "Retrait espèces",
                canal="Guichet agence",
                description="Dépôt / Retrait sous seuil réglementaire",
                date_transaction=tx_time,
            ))

        # 2. Reste des transactions (historique 90 jours)
        for i in range(nb_tx - 8):
            if i < 25:
                # Pic récent 7 jours
                date_tx = now - timedelta(days=random.randint(2, 7), hours=random.randint(1, 23))
                montant = round(base_amount * random.uniform(3.0, 5.5), 0)
            else:
                date_tx = now - timedelta(days=random.randint(8, 90), hours=random.randint(1, 23))
                montant = round(base_amount * random.uniform(0.8, 1.3), 0)

            benef = f"{random.choice(NOMS_FAMILLE)}, {random.choice(PRENOMS_HOMMES)}"
            transactions.append(Transaction(
                id=str(uuid.uuid4()),
                reference=f"TXN-{uuid.uuid4().hex[:10].upper()}",
                client_id=client_id,
                compte_source_id=account.id,
                numero_compte_expediteur=account.numero_compte,
                compte_destination_id=None,
                beneficiaire_nom=benef,
                montant=montant,
                devise="XOF",
                type_operation=random.choice(TYPES_OPERATION),
                canal=random.choice(CANAUX),
                description="Transfert de fonds",
                date_transaction=date_tx,
            ))

    return transactions


def main():
    print("==================================================================")
    print("   LAKANA — PEUPLEMENT MASSIF : 200+ CLIENTS & 90+ TXS / CLIENT   ")
    print("==================================================================")

    db = SessionLocal()
    try:
        # Étape 1 : Vérification schéma BDD
        ensure_database_schema(db)

        # Étape 2 : Mettre à jour les transactions existantes sans compte expéditeur
        fix_existing_transactions(db)

        # Vérifier le nombre actuel de clients
        existing_clients_count = db.query(Client).count()
        print(f"[INFO] Nombre actuel de clients en base : {existing_clients_count}")

        TARGET_NEW_CLIENTS = 210
        print(f"[ACTION] Création de {TARGET_NEW_CLIENTS} nouveaux clients avec comptes et transactions...\n")

        all_new_clients = []
        all_new_accounts = []
        all_new_transactions = []

        total_tx_created = 0

        for idx in range(1, TARGET_NEW_CLIENTS + 1):
            client_dict, risk_profile = create_client_profile(existing_clients_count + idx)
            client = Client(**client_dict)
            all_new_clients.append(client)

            # Compte bancaire principal du client
            account_num = generate_account_number(existing_clients_count + idx, bank_code="ML01")
            account = Account(
                id=str(uuid.uuid4()),
                numero_compte=account_num,
                client_id=client.id,
                type_compte="Courant",
                solde=round(random.uniform(500_000, 12_000_000), 0),
                devise="XOF",
                date_ouverture=client.created_at,
            )
            all_new_accounts.append(account)

            # Si entreprise ou profil moyen/élevé, parfois 2ème compte (Épargne)
            if client.type_client == "Entreprise" or risk_profile != "Faible":
                account_epargne = Account(
                    id=str(uuid.uuid4()),
                    numero_compte=generate_account_number(existing_clients_count + idx + 5000, bank_code="ML02"),
                    client_id=client.id,
                    type_compte="Épargne",
                    solde=round(random.uniform(1_000_000, 25_000_000), 0),
                    devise="XOF",
                    date_ouverture=client.created_at + timedelta(days=10),
                )
                all_new_accounts.append(account_epargne)

            # Génération de 92 transactions pour ce client (au moins 90 requises)
            txs = generate_transactions_for_client(
                client_id=client.id,
                account=account,
                risk_profile=risk_profile,
                nb_tx=random.randint(90, 95)
            )
            all_new_transactions.extend(txs)
            total_tx_created += len(txs)

            if idx % 35 == 0 or idx == TARGET_NEW_CLIENTS:
                print(f"  -> Généré : {idx}/{TARGET_NEW_CLIENTS} clients | ~{total_tx_created} transactions prêtes...")

        # Étape 3 : Sauvegarde en base par lots optimisés
        print("\n[PERSISTANCE] Insertion des clients et comptes en base...")
        db.bulk_save_objects(all_new_clients)
        db.bulk_save_objects(all_new_accounts)
        db.commit()
        print(f"[OK] {len(all_new_clients)} clients et {len(all_new_accounts)} comptes créés.")

        print(f"[PERSISTANCE] Insertion de {len(all_new_transactions)} transactions par lots de 2 500...")
        BATCH_SIZE = 2500
        for b_start in range(0, len(all_new_transactions), BATCH_SIZE):
            batch = all_new_transactions[b_start:b_start + BATCH_SIZE]
            db.bulk_save_objects(batch)
            db.commit()
            print(f"  - Lot inséré : {min(b_start + BATCH_SIZE, len(all_new_transactions))}/{len(all_new_transactions)} transactions")

        print(f"\n[SUCCÈS] Total de {len(all_new_transactions)} transactions avec numéro de compte expéditeur sauvegardées.")

        # Étape 4 : Recalcul dynamique des scores de risque
        print("\n[SCORING] Recalcul et consolidation des Risk Scores des sociétaires...")
        clients_to_score = db.query(Client).limit(50).all()
        for c in clients_to_score:
            scoring_service.calculate_score(db, c)
        print("[OK] Risk Scores recalculés avec succès.")

        # Étape 5 : Réentraînement du modèle Machine Learning
        print("\n[MACHINE LEARNING] Réentraînement complet des modèles IA (Isolation Forest + Random Forest)...")
        train_result = train_models(db, count_synthetic=400)
        print(f"[ML SUCCESS] Statut : {train_result['status']}")
        print(f"  * Total échantillons entraînés : {train_result['total_samples']}")
        print(f"  * Clients réels ingérés : {train_result['real_clients_count']}")
        print(f"  * Modèles sauvegardés : {train_result['models_saved']}")

        # Statistiques finales
        final_clients = db.query(Client).count()
        final_txs = db.query(Transaction).count()
        final_accounts = db.query(Account).count()
        txs_with_expediteur = db.query(Transaction).filter(Transaction.numero_compte_expediteur != None).count()

        print("\n==================================================================")
        print("   BILAN GLOBAL DE LA BASE DE DONNÉES LAKANA")
        print("==================================================================")
        print(f"  • Sociétaires (Clients) : {final_clients}")
        print(f"  • Comptes bancaires     : {final_accounts}")
        print(f"  • Transactions totales  : {final_txs}")
        print(f"  • Tx avec Cpt Expéditeur: {txs_with_expediteur} ({(txs_with_expediteur / final_txs) * 100:.1f}%)")
        print("==================================================================")

    except Exception as e:
        db.rollback()
        print(f"\n[ERREUR] Une erreur est survenue : {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
